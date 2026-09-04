import { AppError } from "../../utils/AppError.js";
import { createActionConfirmation } from "../../utils/actionConfirmation.js";
import { combineDateAndTime, dayOfWeekForDate, timeForSchedule } from "../../utils/dateTime.js";
import { eventsModel } from "../events/events.model.js";
import { scheduleModel } from "../schedule/schedule.model.js";
import { authorizationService } from "../users/authorization.service.js";
import { roomsModel } from "./rooms.model.js";
import type { AvailabilityQuery, BookingInput, RoomInput, RoomListQuery, RoomUpdateInput } from "./rooms.validation.js";

export const roomsService = {
  list(query: RoomListQuery = {}) { return roomsModel.findMany(query); },
  async getById(id: string) {
    const room = await roomsModel.findById(id);
    if (!room) throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    return room;
  },
  create(input: RoomInput) { return roomsModel.create(input); },
  async update(id: string, input: RoomUpdateInput) {
    await this.getById(id);
    return roomsModel.update(id, input);
  },
  async remove(id: string) {
    await this.getById(id);
    await roomsModel.delete(id);
  },
  findAvailable(query: AvailabilityQuery) {
    return roomsModel.findAvailable(query, dayOfWeekForDate(combineDateAndTime(query.date, query.startTime)));
  },
  async book(roomId: string, externalUserId: string, input: BookingInput) {
    const actor = await authorizationService.requireActor(externalUserId, "ROOM_BOOK");
    const room = await this.getById(roomId);
    if (room.status !== "AVAILABLE") throw new AppError("Room is not available for booking", 409, "ROOM_UNAVAILABLE");
    const startsAt = combineDateAndTime(input.date, input.startTime);
    const endsAt = combineDateAndTime(input.date, input.endTime);
    if (startsAt <= new Date()) throw new AppError("Room bookings must start in the future", 409, "BOOKING_IN_PAST");
    const dayOfWeek = dayOfWeekForDate(startsAt);
    const [bookingConflict, scheduleConflict, eventConflict, userBookingConflict, userScheduleConflict, userEventConflict] = await Promise.all([
      roomsModel.findBookingConflict(room.id, startsAt, endsAt),
      scheduleModel.findRoomConflict(room.id, dayOfWeek, input.startTime, input.endTime),
      roomsModel.findEventConflict(room.id, startsAt, endsAt),
      roomsModel.findUserBookingConflict(externalUserId, startsAt, endsAt),
      scheduleModel.findUserConflict(externalUserId, dayOfWeek, input.startTime, input.endTime),
      eventsModel.findUserEventConflict(externalUserId, undefined, startsAt, endsAt)
    ]);
    if (bookingConflict || scheduleConflict || eventConflict) {
      throw new AppError("Room is already occupied during this time", 409, "ROOM_BOOKING_CONFLICT");
    }
    if (userBookingConflict || userScheduleConflict || userEventConflict) {
      throw new AppError("You already have a campus commitment during this time", 409, "USER_SCHEDULE_CONFLICT");
    }
    const booking = await roomsModel.createBooking(room.id, externalUserId, actor.name, input);
    return createActionConfirmation(
      "ROOM_BOOKING",
      `${room.number} is booked for ${input.date} from ${input.startTime} to ${input.endTime}.`,
      booking
    );
  },
  myBookings(externalUserId: string) {
    return roomsModel.findUserBookings(externalUserId);
  },
  async cancelBooking(roomId: string, bookingId: string, externalUserId: string) {
    const actor = await authorizationService.requireActor(externalUserId, "ROOM_BOOKING_CANCEL");
    const booking = await roomsModel.findBookingById(bookingId);
    if (!booking || booking.roomId !== roomId) throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
    if (!booking.user) throw new AppError("This booking has no owner on record", 409, "BOOKING_OWNERLESS");
    authorizationService.requireSelfOrAdmin(actor, booking.user.externalId);
    await roomsModel.deleteBooking(bookingId);
    return createActionConfirmation(
      "ROOM_BOOKING_CANCEL",
      `Your booking for ${booking.room.number} on ${booking.startsAt.toISOString().slice(0, 10)} from ${timeForSchedule(booking.startsAt)} to ${timeForSchedule(booking.endsAt)} has been cancelled.`,
      booking
    );
  }
};
