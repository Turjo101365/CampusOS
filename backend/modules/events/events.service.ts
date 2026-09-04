import { AppError } from "../../utils/AppError.js";
import { createActionConfirmation } from "../../utils/actionConfirmation.js";
import { dayOfWeekForDate, timeForSchedule } from "../../utils/dateTime.js";
import { roomsModel } from "../rooms/rooms.model.js";
import { scheduleModel } from "../schedule/schedule.model.js";
import { authorizationService } from "../users/authorization.service.js";
import { usersService } from "../users/users.service.js";
import { eventsModel } from "./events.model.js";
import type { EventInput, EventListQuery, EventUpdateInput } from "./events.validation.js";

async function resolveRoomId(roomNumber: string | null | undefined) {
  if (roomNumber === undefined) return undefined;
  if (roomNumber === null) return null;
  const room = await roomsModel.findByNumber(roomNumber);
  if (!room) throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
  return room.id;
}

export const eventsService = {
  list(query: EventListQuery = {}) { return eventsModel.findMany(query); },
  async getById(id: string) {
    const event = await eventsModel.findById(id);
    if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
    return event;
  },
  async create(input: EventInput) {
    const roomId = await resolveRoomId(input.roomNumber ?? null);
    return eventsModel.create(input, roomId ?? null);
  },
  async update(id: string, input: EventUpdateInput) {
    const event = await this.getById(id);
    if (input.capacity !== undefined && input.capacity < event._count.registrations) {
      throw new AppError("Capacity cannot be lower than current registrations", 409, "CAPACITY_TOO_LOW");
    }
    const startsAt = input.startsAt ? new Date(input.startsAt) : event.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : event.endsAt;
    if (startsAt >= endsAt) throw new AppError("startsAt must be before endsAt", 422, "INVALID_EVENT_TIME");
    return eventsModel.update(id, input, await resolveRoomId(input.roomNumber));
  },
  async remove(id: string) { await this.getById(id); await eventsModel.delete(id); },
  async register(eventId: string, actorExternalUserId: string, targetExternalUserId = actorExternalUserId) {
    const actor = await authorizationService.requireActor(actorExternalUserId, "EVENT_REGISTER");
    authorizationService.requireSelfOrAdmin(actor, targetExternalUserId);
    await usersService.getById(targetExternalUserId);
    const event = await this.getById(eventId);
    if (event.status !== "UPCOMING" || event.startsAt <= new Date()) {
      throw new AppError("Registration is closed", 409, "REGISTRATION_CLOSED");
    }
    if (event._count.registrations >= event.capacity) {
      throw new AppError("Event is at capacity", 409, "EVENT_FULL");
    }
    if (await eventsModel.findRegistration(eventId, targetExternalUserId)) {
      throw new AppError("User is already registered", 409, "ALREADY_REGISTERED");
    }
    const dayOfWeek = dayOfWeekForDate(event.startsAt);
    const startTime = timeForSchedule(event.startsAt);
    const endTime = timeForSchedule(event.endsAt);
    const [eventConflict, bookingConflict, scheduleConflict] = await Promise.all([
      eventsModel.findUserEventConflict(targetExternalUserId, eventId, event.startsAt, event.endsAt),
      roomsModel.findUserBookingConflict(targetExternalUserId, event.startsAt, event.endsAt),
      scheduleModel.findUserConflict(targetExternalUserId, dayOfWeek, startTime, endTime)
    ]);
    if (eventConflict || bookingConflict || scheduleConflict) {
      throw new AppError("The user already has a campus commitment during this event", 409, "EVENT_SCHEDULE_CONFLICT");
    }
    const registration = await eventsModel.register(eventId, targetExternalUserId);
    return createActionConfirmation(
      "EVENT_REGISTRATION",
      `Registration for ${event.name} is confirmed.`,
      registration
    );
  }
};
