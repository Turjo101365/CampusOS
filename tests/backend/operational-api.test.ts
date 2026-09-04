import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../backend/app.js";
import { assignmentsService } from "../../backend/modules/assignments/assignments.service.js";
import { eventsService } from "../../backend/modules/events/events.service.js";
import { roomsService } from "../../backend/modules/rooms/rooms.service.js";
import { AppError } from "../../backend/utils/AppError.js";
import { createActionConfirmation } from "../../backend/utils/actionConfirmation.js";

afterEach(() => vi.restoreAllMocks());

describe("Operational REST API Endpoints", () => {
  describe("POST /api/v1/rooms/:id/bookings", () => {
    it("returns 201 and confirmation receipt on valid room booking", async () => {
      vi.spyOn(roomsService, "book").mockResolvedValue(
        createActionConfirmation("ROOM_BOOKING", "7A01 is booked for 2099-09-07 from 14:00 to 15:00.", {
          id: "booking-101",
          roomId: "room-1"
        } as never)
      );

      const response = await request(app)
        .post("/api/v1/rooms/room-1/bookings")
        .set("x-user-id", "student-001")
        .send({
          date: "2099-09-07",
          startTime: "14:00",
          endTime: "15:00",
          purpose: "Group study"
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Room booking confirmed",
        data: {
          action: "ROOM_BOOKING",
          status: "CONFIRMED",
          result: { id: "booking-101" }
        }
      });
      expect(roomsService.book).toHaveBeenCalledWith(
        "room-1",
        "student-001",
        expect.objectContaining({ purpose: "Group study" })
      );
    });

    it("returns 422 validation error when startTime is not before endTime", async () => {
      const response = await request(app)
        .post("/api/v1/rooms/room-1/bookings")
        .send({
          date: "2099-09-07",
          startTime: "16:00",
          endTime: "15:00",
          purpose: "Group study"
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "VALIDATION_ERROR" }
      });
    });

    it("returns 409 conflict when room is already occupied", async () => {
      vi.spyOn(roomsService, "book").mockRejectedValue(
        new AppError("Room is already occupied during this time", 409, "ROOM_BOOKING_CONFLICT")
      );

      const response = await request(app)
        .post("/api/v1/rooms/room-1/bookings")
        .send({
          date: "2099-09-07",
          startTime: "14:00",
          endTime: "15:00",
          purpose: "Group study"
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "ROOM_BOOKING_CONFLICT" }
      });
    });
  });

  describe("DELETE /api/v1/rooms/:id/bookings/:bookingId", () => {
    it("returns 200 and confirmation receipt on valid booking cancellation", async () => {
      vi.spyOn(roomsService, "cancelBooking").mockResolvedValue(
        createActionConfirmation("ROOM_BOOKING_CANCEL", "Your booking for 7A01 on 2099-09-07 from 14:00 to 15:00 has been cancelled.", {
          id: "booking-101",
          roomId: "room-1"
        } as never)
      );

      const response = await request(app)
        .delete("/api/v1/rooms/room-1/bookings/booking-101")
        .set("x-user-id", "student-001")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Room booking cancelled",
        data: { action: "ROOM_BOOKING_CANCEL", status: "CONFIRMED", result: { id: "booking-101" } }
      });
      expect(roomsService.cancelBooking).toHaveBeenCalledWith("room-1", "booking-101", "student-001");
    });

    it("returns 404 when the booking does not exist", async () => {
      vi.spyOn(roomsService, "cancelBooking").mockRejectedValue(
        new AppError("Booking not found", 404, "BOOKING_NOT_FOUND")
      );

      const response = await request(app)
        .delete("/api/v1/rooms/room-1/bookings/missing")
        .set("x-user-id", "student-001")
        .expect(404);

      expect(response.body).toMatchObject({ success: false, error: { code: "BOOKING_NOT_FOUND" } });
    });

    it("returns 403 when a different user attempts to cancel someone else's booking", async () => {
      vi.spyOn(roomsService, "cancelBooking").mockRejectedValue(
        new AppError("You cannot perform this action for another user", 403, "TARGET_USER_FORBIDDEN")
      );

      const response = await request(app)
        .delete("/api/v1/rooms/room-1/bookings/booking-101")
        .set("x-user-id", "student-002")
        .expect(403);

      expect(response.body).toMatchObject({ success: false, error: { code: "TARGET_USER_FORBIDDEN" } });
    });
  });

  describe("POST /api/v1/events/:id/registrations", () => {
    it("returns 201 and confirmation receipt on event registration", async () => {
      vi.spyOn(eventsService, "register").mockResolvedValue(
        createActionConfirmation("EVENT_REGISTRATION", "Registration for Tech Talk is confirmed.", {
          id: "reg-1",
          eventId: "event-1"
        } as never)
      );

      const response = await request(app)
        .post("/api/v1/events/event-1/registrations")
        .set("x-user-id", "student-001")
        .send({})
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Event registration confirmed",
        data: {
          action: "EVENT_REGISTRATION",
          status: "CONFIRMED"
        }
      });
      expect(eventsService.register).toHaveBeenCalledWith("event-1", "student-001", "student-001");
    });

    it("returns 409 when event is at capacity", async () => {
      vi.spyOn(eventsService, "register").mockRejectedValue(
        new AppError("Event is at capacity", 409, "EVENT_FULL")
      );

      const response = await request(app)
        .post("/api/v1/events/event-1/registrations")
        .set("x-user-id", "student-001")
        .send({})
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "EVENT_FULL" }
      });
    });

    it("returns 403 when non-admin attempts to register another user", async () => {
      vi.spyOn(eventsService, "register").mockRejectedValue(
        new AppError("You cannot perform this action for another user", 403, "TARGET_USER_FORBIDDEN")
      );

      const response = await request(app)
        .post("/api/v1/events/event-1/registrations")
        .set("x-user-id", "student-001")
        .send({ userId: "student-002" })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "TARGET_USER_FORBIDDEN" }
      });
    });
  });

  describe("DELETE /api/v1/events/:id/registrations", () => {
    it("returns 200 and confirmation receipt on valid registration cancellation", async () => {
      vi.spyOn(eventsService, "cancelRegistration").mockResolvedValue(
        createActionConfirmation("EVENT_REGISTRATION_CANCEL", "Your registration for Tech Talk has been cancelled.", {
          id: "reg-1",
          eventId: "event-1"
        } as never)
      );

      const response = await request(app)
        .delete("/api/v1/events/event-1/registrations")
        .set("x-user-id", "student-001")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Event registration cancelled",
        data: { action: "EVENT_REGISTRATION_CANCEL", status: "CONFIRMED" }
      });
      expect(eventsService.cancelRegistration).toHaveBeenCalledWith("event-1", "student-001", "student-001");
    });

    it("returns 404 when there is no registration to cancel", async () => {
      vi.spyOn(eventsService, "cancelRegistration").mockRejectedValue(
        new AppError("Registration not found", 404, "REGISTRATION_NOT_FOUND")
      );

      const response = await request(app)
        .delete("/api/v1/events/event-1/registrations")
        .set("x-user-id", "student-001")
        .expect(404);

      expect(response.body).toMatchObject({ success: false, error: { code: "REGISTRATION_NOT_FOUND" } });
    });
  });

  describe("PATCH /api/v1/assignments/:id/status", () => {
    it("returns 200 and confirmation receipt on valid assignment status update", async () => {
      vi.spyOn(assignmentsService, "setStatus").mockResolvedValue(
        createActionConfirmation("ASSIGNMENT_STATUS_UPDATE", "Lab 1 is now in progress.", {
          id: "sub-1",
          status: "IN_PROGRESS"
        } as never)
      );

      const response = await request(app)
        .patch("/api/v1/assignments/asg-1/status")
        .set("x-user-id", "student-001")
        .send({ status: "IN_PROGRESS" })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Assignment status update confirmed",
        data: {
          action: "ASSIGNMENT_STATUS_UPDATE",
          status: "CONFIRMED"
        }
      });
      expect(assignmentsService.setStatus).toHaveBeenCalledWith("asg-1", "student-001", "IN_PROGRESS");
    });

    it("returns 422 for invalid assignment status value", async () => {
      const response = await request(app)
        .patch("/api/v1/assignments/asg-1/status")
        .send({ status: "INVALID_STATUS" })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "VALIDATION_ERROR" }
      });
    });

    it("returns 403 when student is not enrolled", async () => {
      vi.spyOn(assignmentsService, "setStatus").mockRejectedValue(
        new AppError("You are not enrolled in this assignment's course", 403, "ASSIGNMENT_ACCESS_FORBIDDEN")
      );

      const response = await request(app)
        .patch("/api/v1/assignments/asg-1/status")
        .set("x-user-id", "student-001")
        .send({ status: "IN_PROGRESS" })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "ASSIGNMENT_ACCESS_FORBIDDEN" }
      });
    });

    it("returns 409 when invalid status transition is requested", async () => {
      vi.spyOn(assignmentsService, "setStatus").mockRejectedValue(
        new AppError("Assignment status cannot change from SUBMITTED to IN_PROGRESS", 409, "INVALID_STATUS_TRANSITION")
      );

      const response = await request(app)
        .patch("/api/v1/assignments/asg-1/status")
        .set("x-user-id", "student-001")
        .send({ status: "IN_PROGRESS" })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: "INVALID_STATUS_TRANSITION" }
      });
    });
  });
});
