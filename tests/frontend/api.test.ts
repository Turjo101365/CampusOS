import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../frontend/services/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("frontend api operational methods", () => {
  it("bookRoom sends POST request to /rooms/:id/bookings", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          action: "ROOM_BOOKING",
          status: "CONFIRMED",
          message: "7A01 booked",
          confirmedAt: "2026-09-04T12:00:00.000Z",
          result: { id: "booking-1" }
        }
      })
    } as Response);

    const receipt = await api.bookRoom("room-123", {
      date: "2099-09-07",
      startTime: "14:00",
      endTime: "15:00",
      purpose: "Study"
    });

    expect(receipt).toMatchObject({
      action: "ROOM_BOOKING",
      status: "CONFIRMED"
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/room-123/bookings"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          date: "2099-09-07",
          startTime: "14:00",
          endTime: "15:00",
          purpose: "Study"
        })
      })
    );
  });

  it("registerEvent sends POST request to /events/:id/registrations", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          action: "EVENT_REGISTRATION",
          status: "CONFIRMED",
          message: "Registered",
          confirmedAt: "2026-09-04T12:00:00.000Z",
          result: { id: "reg-1" }
        }
      })
    } as Response);

    const receipt = await api.registerEvent("event-456");

    expect(receipt).toMatchObject({
      action: "EVENT_REGISTRATION",
      status: "CONFIRMED"
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/events/event-456/registrations"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({})
      })
    );
  });

  it("updateAssignmentStatus sends PATCH request to /assignments/:id/status", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          action: "ASSIGNMENT_STATUS_UPDATE",
          status: "CONFIRMED",
          message: "Status updated",
          confirmedAt: "2026-09-04T12:00:00.000Z",
          result: { id: "sub-1", status: "IN_PROGRESS" }
        }
      })
    } as Response);

    const receipt = await api.updateAssignmentStatus("asg-789", "IN_PROGRESS");

    expect(receipt).toMatchObject({
      action: "ASSIGNMENT_STATUS_UPDATE",
      status: "CONFIRMED"
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/assignments/asg-789/status"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" })
      })
    );
  });

  it("confirmAction dispatches correctly for each pending action type", async () => {
    const bookSpy = vi.spyOn(api, "bookRoom").mockResolvedValue({
      action: "ROOM_BOOKING",
      status: "CONFIRMED",
      message: "Room booked",
      confirmedAt: "2026-09-04T12:00:00.000Z",
      result: {}
    });

    const regSpy = vi.spyOn(api, "registerEvent").mockResolvedValue({
      action: "EVENT_REGISTRATION",
      status: "CONFIRMED",
      message: "Event registered",
      confirmedAt: "2026-09-04T12:00:00.000Z",
      result: {}
    });

    const statusSpy = vi.spyOn(api, "updateAssignmentStatus").mockResolvedValue({
      action: "ASSIGNMENT_STATUS_UPDATE",
      status: "CONFIRMED",
      message: "Assignment status updated",
      confirmedAt: "2026-09-04T12:00:00.000Z",
      result: {}
    });

    await api.confirmAction({
      type: "ROOM_BOOKING",
      summary: "Book 7A01",
      payload: {
        roomId: "r1",
        roomNumber: "7A01",
        date: "2099-09-07",
        startTime: "14:00",
        endTime: "15:00",
        purpose: "Meeting"
      }
    });
    expect(bookSpy).toHaveBeenCalledWith("r1", {
      date: "2099-09-07",
      startTime: "14:00",
      endTime: "15:00",
      purpose: "Meeting"
    });

    await api.confirmAction({
      type: "EVENT_REGISTRATION",
      summary: "Register for Summit",
      payload: {
        eventId: "e1",
        eventName: "Summit"
      }
    });
    expect(regSpy).toHaveBeenCalledWith("e1");

    await api.confirmAction({
      type: "ASSIGNMENT_STATUS_UPDATE",
      summary: "Mark Lab 1 in progress",
      payload: {
        assignmentId: "a1",
        assignmentTitle: "Lab 1",
        status: "IN_PROGRESS"
      }
    });
    expect(statusSpy).toHaveBeenCalledWith("a1", "IN_PROGRESS");
  });
});

