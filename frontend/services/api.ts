import type {
  ActionConfirmation,
  AgentReply,
  Announcement,
  AnnouncementInput,
  ApiResponse,
  Assignment,
  AssignmentInput,
  CampusEvent,
  EventInput,
  Notification,
  PendingAction,
  Room,
  RoomBookingSummary,
  RoomInput,
  Schedule,
  ScheduleInput
} from "../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store"
  });
  const payload = await response.json() as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new ApiClientError(payload.message || "Request failed", response.status, payload.error?.code);
  }
  return payload.data;
}

function queryString(values: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export interface ToolEvent {
  type: "start" | "end";
  tool: string;
}

/**
 * Streams live tool-execution progress from /ai/chat/stream (Server-Sent Events)
 * while the agent works, resolving with the final reply once it lands.
 */
async function streamMessage(message: string, sessionId: string | undefined, onProgress: (event: ToolEvent) => void): Promise<AgentReply> {
  const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
    cache: "no-store"
  });

  if (!response.ok || !response.body) {
    let fallbackMessage = "The assistant is unavailable";
    let code: string | undefined;
    try {
      const payload = await response.json() as ApiResponse<never>;
      fallbackMessage = payload.message || fallbackMessage;
      code = payload.error?.code;
    } catch {
      // response wasn't JSON — keep the generic fallback message
    }
    throw new ApiClientError(fallbackMessage, response.status, code);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AgentReply | null = null;
  let streamErrorMessage: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const eventLine = frame.split("\n").find((line) => line.startsWith("event: "));
      const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
      if (!eventLine || !dataLine) continue;
      const eventName = eventLine.slice("event: ".length);
      const data = JSON.parse(dataLine.slice("data: ".length));
      if (eventName === "progress") onProgress(data as ToolEvent);
      else if (eventName === "result") result = data as AgentReply;
      else if (eventName === "error") streamErrorMessage = (data as { message: string }).message;
    }
  }

  if (streamErrorMessage) throw new ApiClientError(streamErrorMessage, 502);
  if (!result) throw new ApiClientError("The assistant did not return a response", 502);
  return result;
}

export const api = {
  getSchedules: (params: { day?: string; userId?: string } = {}) => request<Schedule[]>(`/schedules${queryString(params)}`),
  createSchedule: (input: ScheduleInput) => request<Schedule>("/schedules", { method: "POST", body: JSON.stringify(input) }),
  updateSchedule: (id: string, input: ScheduleInput) => request<Schedule>(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteSchedule: (id: string) => request<null>(`/schedules/${id}`, { method: "DELETE" }),

  getRooms: () => request<Room[]>("/rooms"),
  createRoom: (input: RoomInput) => request<Room>("/rooms", { method: "POST", body: JSON.stringify(input) }),
  updateRoom: (id: string, input: RoomInput) => request<Room>(`/rooms/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteRoom: (id: string) => request<null>(`/rooms/${id}`, { method: "DELETE" }),

  getEvents: (params: { from?: string; to?: string } = {}) => request<CampusEvent[]>(`/events${queryString(params)}`),
  createEvent: (input: EventInput) => request<CampusEvent>("/events", { method: "POST", body: JSON.stringify(input) }),
  updateEvent: (id: string, input: EventInput) => request<CampusEvent>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteEvent: (id: string) => request<null>(`/events/${id}`, { method: "DELETE" }),

  getAssignments: (params: { userId?: string; dueBefore?: string } = {}) => request<Assignment[]>(`/assignments${queryString(params)}`),
  createAssignment: (input: AssignmentInput) => request<Assignment>("/assignments", { method: "POST", body: JSON.stringify(input) }),
  updateAssignment: (id: string, input: AssignmentInput) => request<Assignment>(`/assignments/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteAssignment: (id: string) => request<null>(`/assignments/${id}`, { method: "DELETE" }),

  getAnnouncements: (params: { activeOnly?: boolean } = {}) => request<Announcement[]>(`/announcements${queryString(params)}`),
  createAnnouncement: (input: AnnouncementInput) => request<Announcement>("/announcements", { method: "POST", body: JSON.stringify(input) }),
  updateAnnouncement: (id: string, input: AnnouncementInput) => request<Announcement>(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteAnnouncement: (id: string) => request<null>(`/announcements/${id}`, { method: "DELETE" }),

  getNotifications: (params: { status?: Notification["status"]; limit?: number } = {}) => request<Notification[]>(`/notifications${queryString(params)}`),
  markNotificationRead: (id: string) => request<Notification>(`/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "READ" })
  }),
  sendMessage: (message: string, sessionId?: string) => request<AgentReply>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, sessionId })
  }),
  streamMessage,
  bookRoom: (roomId: string, input: { date: string; startTime: string; endTime: string; purpose: string }) =>
    request<ActionConfirmation>(`/rooms/${roomId}/bookings`, {
      method: "POST",
      body: JSON.stringify(input)
    }),
  getMyRoomBookings: () => request<RoomBookingSummary[]>("/rooms/bookings/mine"),
  cancelRoomBooking: (roomId: string, bookingId: string) =>
    request<ActionConfirmation>(`/rooms/${roomId}/bookings/${bookingId}`, { method: "DELETE" }),
  registerEvent: (eventId: string, userId?: string) =>
    request<ActionConfirmation>(`/events/${eventId}/registrations`, {
      method: "POST",
      body: JSON.stringify(userId ? { userId } : {})
    }),
  cancelEventRegistration: (eventId: string) =>
    request<ActionConfirmation>(`/events/${eventId}/registrations`, { method: "DELETE" }),
  updateAssignmentStatus: (assignmentId: string, status: "PENDING" | "IN_PROGRESS" | "SUBMITTED") =>
    request<ActionConfirmation>(`/assignments/${assignmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  confirmAction: (action: PendingAction): Promise<ActionConfirmation> => {
    if (action.type === "ROOM_BOOKING") {
      const { roomId, date, startTime, endTime, purpose } = action.payload;
      return api.bookRoom(roomId, { date, startTime, endTime, purpose });
    }
    if (action.type === "ROOM_BOOKING_CANCEL") {
      return api.cancelRoomBooking(action.payload.roomId, action.payload.bookingId);
    }
    if (action.type === "EVENT_REGISTRATION") {
      return api.registerEvent(action.payload.eventId);
    }
    if (action.type === "EVENT_REGISTRATION_CANCEL") {
      return api.cancelEventRegistration(action.payload.eventId);
    }
    return api.updateAssignmentStatus(action.payload.assignmentId, action.payload.status);
  }
};
