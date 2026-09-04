import { afterEach, describe, expect, it, vi } from "vitest";
import { executeCampusTool } from "../../backend/ai/tools.js";
import { assignmentsModel } from "../../backend/modules/assignments/assignments.model.js";
import { assignmentsService } from "../../backend/modules/assignments/assignments.service.js";
import { eventsModel } from "../../backend/modules/events/events.model.js";
import { eventsService } from "../../backend/modules/events/events.service.js";
import { roomsModel } from "../../backend/modules/rooms/rooms.model.js";
import { roomsService } from "../../backend/modules/rooms/rooms.service.js";
import { scheduleModel } from "../../backend/modules/schedule/schedule.model.js";
import { authorizationService } from "../../backend/modules/users/authorization.service.js";
import { usersService } from "../../backend/modules/users/users.service.js";

const student = {
  id: "user-db-id",
  externalId: "student-001",
  name: "Demo Student",
  email: "student@example.edu",
  role: "STUDENT",
  createdAt: new Date(),
  updatedAt: new Date()
} as const;

afterEach(() => vi.restoreAllMocks());

describe("operational action services", () => {
  describe("room booking", () => {
    it("books a conflict-free room and returns a confirmation receipt", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsService, "getById").mockResolvedValue({
        id: "room-1", number: "7A01", status: "AVAILABLE"
      } as never);
      vi.spyOn(roomsModel, "findBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findUserBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findEventConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findRoomConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findUserConflict").mockResolvedValue(null);
      vi.spyOn(eventsModel, "findUserEventConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "createBooking").mockResolvedValue({ id: "booking-1" } as never);

      const result = await roomsService.book("room-1", student.externalId, {
        date: "2099-09-07", startTime: "14:00", endTime: "15:00", purpose: "Project meeting"
      });

      expect(result).toMatchObject({ action: "ROOM_BOOKING", status: "CONFIRMED", result: { id: "booking-1" } });
      expect(roomsModel.createBooking).toHaveBeenCalledWith(
        "room-1", student.externalId, student.name, expect.objectContaining({ purpose: "Project meeting" })
      );
    });

    it("rejects room booking when the room is under maintenance", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsService, "getById").mockResolvedValue({
        id: "room-1", number: "7A01", status: "MAINTENANCE"
      } as never);

      await expect(roomsService.book("room-1", student.externalId, {
        date: "2099-09-07", startTime: "14:00", endTime: "15:00", purpose: "Project meeting"
      })).rejects.toMatchObject({ code: "ROOM_UNAVAILABLE", statusCode: 409 });
    });

    it("rejects room booking when booking date-time is in the past", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsService, "getById").mockResolvedValue({
        id: "room-1", number: "7A01", status: "AVAILABLE"
      } as never);

      await expect(roomsService.book("room-1", student.externalId, {
        date: "2020-01-01", startTime: "10:00", endTime: "11:00", purpose: "Old meeting"
      })).rejects.toMatchObject({ code: "BOOKING_IN_PAST", statusCode: 409 });
    });

    it("does not create a room booking when the user has another room booking conflict", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsService, "getById").mockResolvedValue({ id: "room-1", number: "7A01", status: "AVAILABLE" } as never);
      vi.spyOn(roomsModel, "findBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findUserBookingConflict").mockResolvedValue({ id: "existing" } as never);
      vi.spyOn(roomsModel, "findEventConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findRoomConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findUserConflict").mockResolvedValue(null);
      vi.spyOn(eventsModel, "findUserEventConflict").mockResolvedValue(null);
      const create = vi.spyOn(roomsModel, "createBooking");

      await expect(roomsService.book("room-1", student.externalId, {
        date: "2099-09-07", startTime: "14:00", endTime: "15:00", purpose: "Project meeting"
      })).rejects.toMatchObject({ code: "USER_SCHEDULE_CONFLICT", statusCode: 409 });
      expect(create).not.toHaveBeenCalled();
    });

    it("rejects room booking when user is already registered for an event at that time", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsService, "getById").mockResolvedValue({ id: "room-1", number: "7A01", status: "AVAILABLE" } as never);
      vi.spyOn(roomsModel, "findBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findUserBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findEventConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findRoomConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findUserConflict").mockResolvedValue(null);
      vi.spyOn(eventsModel, "findUserEventConflict").mockResolvedValue({ id: "event-reg-1" } as never);

      await expect(roomsService.book("room-1", student.externalId, {
        date: "2099-09-07", startTime: "14:00", endTime: "15:00", purpose: "Project meeting"
      })).rejects.toMatchObject({ code: "USER_SCHEDULE_CONFLICT", statusCode: 409 });
    });

    it("rejects room booking when the room has an event conflict", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsService, "getById").mockResolvedValue({ id: "room-1", number: "7A01", status: "AVAILABLE" } as never);
      vi.spyOn(roomsModel, "findBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findUserBookingConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findEventConflict").mockResolvedValue({ id: "event-1" } as never);
      vi.spyOn(scheduleModel, "findRoomConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findUserConflict").mockResolvedValue(null);
      vi.spyOn(eventsModel, "findUserEventConflict").mockResolvedValue(null);

      await expect(roomsService.book("room-1", student.externalId, {
        date: "2099-09-07", startTime: "14:00", endTime: "15:00", purpose: "Project meeting"
      })).rejects.toMatchObject({ code: "ROOM_BOOKING_CONFLICT", statusCode: 409 });
    });
  });

  describe("room booking cancellation", () => {
    it("cancels the owner's own booking and returns a confirmation receipt", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsModel, "findBookingById").mockResolvedValue({
        id: "booking-1", roomId: "room-1",
        startsAt: new Date("2099-09-07T14:00:00.000Z"), endsAt: new Date("2099-09-07T15:00:00.000Z"),
        room: { number: "7A01" }, user: { externalId: student.externalId }
      } as never);
      const deleteSpy = vi.spyOn(roomsModel, "deleteBooking").mockResolvedValue(undefined as never);

      const result = await roomsService.cancelBooking("room-1", "booking-1", student.externalId);

      expect(result).toMatchObject({ action: "ROOM_BOOKING_CANCEL", status: "CONFIRMED" });
      expect(deleteSpy).toHaveBeenCalledWith("booking-1");
    });

    it("rejects cancellation when the booking does not belong to the given room", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsModel, "findBookingById").mockResolvedValue({
        id: "booking-1", roomId: "room-other", room: { number: "7A02" }, user: { externalId: student.externalId }
      } as never);

      await expect(
        roomsService.cancelBooking("room-1", "booking-1", student.externalId)
      ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND", statusCode: 404 });
    });

    it("rejects cancellation when a different user attempts to cancel someone else's booking", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(roomsModel, "findBookingById").mockResolvedValue({
        id: "booking-1", roomId: "room-1", room: { number: "7A01" }, user: { externalId: "other-user-002" }
      } as never);

      await expect(
        roomsService.cancelBooking("room-1", "booking-1", student.externalId)
      ).rejects.toMatchObject({ code: "TARGET_USER_FORBIDDEN", statusCode: 403 });
    });
  });

  describe("event registration", () => {
    it("registers the current user for a conflict-free event", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(authorizationService, "requireSelfOrAdmin").mockReturnValue(undefined);
      vi.spyOn(usersService, "getById").mockResolvedValue(student as never);
      vi.spyOn(eventsService, "getById").mockResolvedValue({
        id: "event-1", name: "AI Summit", status: "UPCOMING", capacity: 100,
        startsAt: new Date("2099-09-08T10:00:00.000Z"), endsAt: new Date("2099-09-08T11:00:00.000Z"),
        _count: { registrations: 5 }
      } as never);
      vi.spyOn(eventsModel, "findRegistration").mockResolvedValue(null);
      vi.spyOn(eventsModel, "findUserEventConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findUserBookingConflict").mockResolvedValue(null);
      vi.spyOn(scheduleModel, "findUserConflict").mockResolvedValue(null);
      vi.spyOn(eventsModel, "register").mockResolvedValue({ id: "registration-1" } as never);

      const result = await eventsService.register("event-1", student.externalId);
      expect(result).toMatchObject({ action: "EVENT_REGISTRATION", status: "CONFIRMED" });
    });

    it("rejects registration when the event is at capacity", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(authorizationService, "requireSelfOrAdmin").mockReturnValue(undefined);
      vi.spyOn(usersService, "getById").mockResolvedValue(student as never);
      vi.spyOn(eventsService, "getById").mockResolvedValue({
        id: "event-1", name: "AI Summit", status: "UPCOMING", capacity: 10,
        startsAt: new Date("2099-09-08T10:00:00.000Z"), endsAt: new Date("2099-09-08T11:00:00.000Z"),
        _count: { registrations: 10 }
      } as never);

      await expect(eventsService.register("event-1", student.externalId)).rejects.toMatchObject({
        code: "EVENT_FULL", statusCode: 409
      });
    });

    it("rejects registration when the user is already registered", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(authorizationService, "requireSelfOrAdmin").mockReturnValue(undefined);
      vi.spyOn(usersService, "getById").mockResolvedValue(student as never);
      vi.spyOn(eventsService, "getById").mockResolvedValue({
        id: "event-1", name: "AI Summit", status: "UPCOMING", capacity: 50,
        startsAt: new Date("2099-09-08T10:00:00.000Z"), endsAt: new Date("2099-09-08T11:00:00.000Z"),
        _count: { registrations: 5 }
      } as never);
      vi.spyOn(eventsModel, "findRegistration").mockResolvedValue({ id: "already-registered" } as never);

      await expect(eventsService.register("event-1", student.externalId)).rejects.toMatchObject({
        code: "ALREADY_REGISTERED", statusCode: 409
      });
    });

    it("rejects registration when non-admin attempts to register another user", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      await expect(eventsService.register("event-1", student.externalId, "other-user-002")).rejects.toMatchObject({
        code: "TARGET_USER_FORBIDDEN", statusCode: 403
      });
    });

    it("rejects registration when user has a room booking commitment conflict", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(authorizationService, "requireSelfOrAdmin").mockReturnValue(undefined);
      vi.spyOn(usersService, "getById").mockResolvedValue(student as never);
      vi.spyOn(eventsService, "getById").mockResolvedValue({
        id: "event-1", name: "AI Summit", status: "UPCOMING", capacity: 100,
        startsAt: new Date("2099-09-08T10:00:00.000Z"), endsAt: new Date("2099-09-08T11:00:00.000Z"),
        _count: { registrations: 5 }
      } as never);
      vi.spyOn(eventsModel, "findRegistration").mockResolvedValue(null);
      vi.spyOn(eventsModel, "findUserEventConflict").mockResolvedValue(null);
      vi.spyOn(roomsModel, "findUserBookingConflict").mockResolvedValue({ id: "room-booking-conflict" } as never);
      vi.spyOn(scheduleModel, "findUserConflict").mockResolvedValue(null);

      await expect(eventsService.register("event-1", student.externalId)).rejects.toMatchObject({
        code: "EVENT_SCHEDULE_CONFLICT", statusCode: 409
      });
    });
  });

  describe("event registration cancellation", () => {
    it("cancels the owner's own registration and returns a confirmation receipt", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(authorizationService, "requireSelfOrAdmin").mockReturnValue(undefined);
      vi.spyOn(eventsService, "getById").mockResolvedValue({ id: "event-1", name: "AI Summit" } as never);
      vi.spyOn(eventsModel, "findRegistration").mockResolvedValue({ id: "registration-1" } as never);
      const deleteSpy = vi.spyOn(eventsModel, "deleteRegistration").mockResolvedValue(undefined as never);

      const result = await eventsService.cancelRegistration("event-1", student.externalId);

      expect(result).toMatchObject({ action: "EVENT_REGISTRATION_CANCEL", status: "CONFIRMED" });
      expect(deleteSpy).toHaveBeenCalledWith("registration-1");
    });

    it("rejects cancellation when there is no registration to cancel", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(authorizationService, "requireSelfOrAdmin").mockReturnValue(undefined);
      vi.spyOn(eventsService, "getById").mockResolvedValue({ id: "event-1", name: "AI Summit" } as never);
      vi.spyOn(eventsModel, "findRegistration").mockResolvedValue(null);

      await expect(
        eventsService.cancelRegistration("event-1", student.externalId)
      ).rejects.toMatchObject({ code: "REGISTRATION_NOT_FOUND", statusCode: 404 });
    });

    it("rejects cancellation when non-admin attempts to cancel another user's registration", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      await expect(
        eventsService.cancelRegistration("event-1", student.externalId, "other-user-002")
      ).rejects.toMatchObject({ code: "TARGET_USER_FORBIDDEN", statusCode: 403 });
    });
  });

  describe("assignment status update", () => {
    it("updates an enrolled student's assignment status through a legal transition", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(assignmentsService, "getById").mockResolvedValue({
        id: "assignment-1", title: "Architecture report", dueAt: new Date("2099-09-10T12:00:00.000Z")
      } as never);
      vi.spyOn(assignmentsModel, "isUserEnrolled").mockResolvedValue({ id: "enrollment-1" } as never);
      vi.spyOn(assignmentsModel, "findSubmission").mockResolvedValue(null);
      vi.spyOn(assignmentsModel, "setStatus").mockResolvedValue({ id: "submission-1", status: "IN_PROGRESS" } as never);

      const result = await assignmentsService.setStatus("assignment-1", student.externalId, "IN_PROGRESS");
      expect(result).toMatchObject({ action: "ASSIGNMENT_STATUS_UPDATE", status: "CONFIRMED" });
    });

    it("rejects assignment status changes for roles without permission", async () => {
      vi.spyOn(usersService, "getById").mockResolvedValue({ ...student, role: "FACULTY" } as never);
      await expect(
        authorizationService.requireActor(student.externalId, "ASSIGNMENT_STATUS_UPDATE")
      ).rejects.toMatchObject({ code: "ACTION_FORBIDDEN", statusCode: 403 });
    });

    it("rejects status updates when student is not enrolled in the course", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(assignmentsService, "getById").mockResolvedValue({
        id: "assignment-1", title: "Architecture report", dueAt: new Date("2099-09-10T12:00:00.000Z")
      } as never);
      vi.spyOn(assignmentsModel, "isUserEnrolled").mockResolvedValue(null);

      await expect(
        assignmentsService.setStatus("assignment-1", student.externalId, "IN_PROGRESS")
      ).rejects.toMatchObject({ code: "ASSIGNMENT_ACCESS_FORBIDDEN", statusCode: 403 });
    });

    it("rejects student attempts to set status to GRADED", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(assignmentsService, "getById").mockResolvedValue({
        id: "assignment-1", title: "Architecture report", dueAt: new Date("2099-09-10T12:00:00.000Z")
      } as never);
      vi.spyOn(assignmentsModel, "isUserEnrolled").mockResolvedValue({ id: "enrollment-1" } as never);

      await expect(
        assignmentsService.setStatus("assignment-1", student.externalId, "GRADED" as never)
      ).rejects.toMatchObject({ code: "STATUS_FORBIDDEN", statusCode: 403 });
    });

    it("rejects illegal transitions from SUBMITTED to IN_PROGRESS", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(assignmentsService, "getById").mockResolvedValue({
        id: "assignment-1", title: "Architecture report", dueAt: new Date("2099-09-10T12:00:00.000Z")
      } as never);
      vi.spyOn(assignmentsModel, "isUserEnrolled").mockResolvedValue({ id: "enrollment-1" } as never);
      vi.spyOn(assignmentsModel, "findSubmission").mockResolvedValue({
        id: "sub-1", status: "SUBMITTED"
      } as never);

      await expect(
        assignmentsService.setStatus("assignment-1", student.externalId, "IN_PROGRESS")
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION", statusCode: 409 });
    });

    it("rejects status updates when deadline has passed", async () => {
      vi.spyOn(authorizationService, "requireActor").mockResolvedValue(student as never);
      vi.spyOn(assignmentsService, "getById").mockResolvedValue({
        id: "assignment-1", title: "Architecture report", dueAt: new Date("2020-01-01T12:00:00.000Z")
      } as never);
      vi.spyOn(assignmentsModel, "isUserEnrolled").mockResolvedValue({ id: "enrollment-1" } as never);
      vi.spyOn(assignmentsModel, "findSubmission").mockResolvedValue(null);

      await expect(
        assignmentsService.setStatus("assignment-1", student.externalId, "IN_PROGRESS")
      ).rejects.toMatchObject({ code: "ASSIGNMENT_DEADLINE_PASSED", statusCode: 409 });
    });
  });

  describe("AI action proposal tools (side-effect-free)", () => {
    it("proposeRoomBooking returns ACTION_CONFIRMATION_REQUIRED and does not write to database", async () => {
      const createBookingSpy = vi.spyOn(roomsModel, "createBooking");

      const result = await executeCampusTool(
        "proposeRoomBooking",
        {
          roomId: "room-101",
          roomNumber: "7A01",
          date: "2099-09-07",
          startTime: "14:00",
          endTime: "15:00",
          purpose: "Capstone team sync"
        },
        student.externalId
      );

      expect(result).toMatchObject({
        kind: "ACTION_CONFIRMATION_REQUIRED",
        pendingAction: {
          type: "ROOM_BOOKING",
          summary: expect.stringContaining("Book room 7A01"),
          payload: {
            roomId: "room-101",
            roomNumber: "7A01",
            date: "2099-09-07",
            startTime: "14:00",
            endTime: "15:00",
            purpose: "Capstone team sync"
          }
        }
      });
      expect(createBookingSpy).not.toHaveBeenCalled();
    });

    it("proposeEventRegistration returns ACTION_CONFIRMATION_REQUIRED and does not register in database", async () => {
      const registerSpy = vi.spyOn(eventsModel, "register");

      const result = await executeCampusTool(
        "proposeEventRegistration",
        {
          eventId: "event-404",
          eventName: "Robotics Workshop"
        },
        student.externalId
      );

      expect(result).toMatchObject({
        kind: "ACTION_CONFIRMATION_REQUIRED",
        pendingAction: {
          type: "EVENT_REGISTRATION",
          summary: "Register for Robotics Workshop?",
          payload: {
            eventId: "event-404",
            eventName: "Robotics Workshop"
          }
        }
      });
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("proposeRoomBookingCancellation returns ACTION_CONFIRMATION_REQUIRED and does not write to database", async () => {
      const deleteSpy = vi.spyOn(roomsModel, "deleteBooking");

      const result = await executeCampusTool(
        "proposeRoomBookingCancellation",
        {
          roomId: "room-101", bookingId: "booking-9", roomNumber: "7A01",
          date: "2099-09-07", startTime: "14:00", endTime: "15:00"
        },
        student.externalId
      );

      expect(result).toMatchObject({
        kind: "ACTION_CONFIRMATION_REQUIRED",
        pendingAction: {
          type: "ROOM_BOOKING_CANCEL",
          summary: expect.stringContaining("Cancel your booking for room 7A01"),
          payload: { roomId: "room-101", bookingId: "booking-9" }
        }
      });
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it("proposeEventRegistrationCancellation returns ACTION_CONFIRMATION_REQUIRED and does not cancel in database", async () => {
      const deleteSpy = vi.spyOn(eventsModel, "deleteRegistration");

      const result = await executeCampusTool(
        "proposeEventRegistrationCancellation",
        { eventId: "event-404", eventName: "Robotics Workshop" },
        student.externalId
      );

      expect(result).toMatchObject({
        kind: "ACTION_CONFIRMATION_REQUIRED",
        pendingAction: {
          type: "EVENT_REGISTRATION_CANCEL",
          summary: "Cancel your registration for Robotics Workshop?",
          payload: { eventId: "event-404", eventName: "Robotics Workshop" }
        }
      });
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it("proposeAssignmentStatusUpdate returns ACTION_CONFIRMATION_REQUIRED and does not update database", async () => {
      const setStatusSpy = vi.spyOn(assignmentsModel, "setStatus");

      const result = await executeCampusTool(
        "proposeAssignmentStatusUpdate",
        {
          assignmentId: "asg-9",
          assignmentTitle: "Operating Systems Lab 2",
          status: "IN_PROGRESS"
        },
        student.externalId
      );

      expect(result).toMatchObject({
        kind: "ACTION_CONFIRMATION_REQUIRED",
        pendingAction: {
          type: "ASSIGNMENT_STATUS_UPDATE",
          summary: "Change Operating Systems Lab 2 to in progress?",
          payload: {
            assignmentId: "asg-9",
            assignmentTitle: "Operating Systems Lab 2",
            status: "IN_PROGRESS"
          }
        }
      });
      expect(setStatusSpy).not.toHaveBeenCalled();
    });
  });
});
