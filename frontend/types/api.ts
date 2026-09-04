export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: { code: string; details?: unknown };
}

export interface Course { id: string; code: string; title: string; department: string }
export interface RoomFeature { id: string; name: string }
export interface RoomBooking { id: string; bookedBy: string; purpose: string; startsAt: string; endsAt: string }
export interface Room {
  id: string; number: string; type: string; capacity: number; floor: number; status: string;
  features: RoomFeature[]; bookings?: RoomBooking[];
}
export interface Schedule {
  id: string; dayOfWeek: string; startTime: string; endTime: string; instructor: string; section: string; semester: string;
  course: Course; room: Pick<Room, "id" | "number" | "type" | "capacity" | "floor" | "status">;
}
export interface CampusEvent {
  id: string; name: string; description: string | null; startsAt: string; endsAt: string; venueLabel: string;
  organizer: string; capacity: number; status: string; _count: { registrations: number }; room?: Room | null;
  registrations?: Array<{ id: string; userId?: string }>;
}
export interface AssignmentSubmission { id: string; status: string; submittedAt: string | null }
export interface Assignment {
  id: string; title: string; description: string | null; assignedAt: string; dueAt: string;
  submissionPlatform: string; marks: number; course: Course; submissions?: AssignmentSubmission[];
}
export interface Announcement {
  id: string; title: string; body: string; priority: string; postedBy: string; publishedAt: string; expiresAt: string | null;
}
export interface Notification {
  id: string;
  sourceType: string;
  sourceId: string | null;
  message: string;
  sendAt: string;
  status: "PENDING" | "SENT" | "READ" | "FAILED";
  createdAt: string;
}
export interface RoomInput {
  number: string;
  type: string;
  capacity: number;
  floor: number;
  status: string;
  features: string[];
}

export interface ScheduleInput {
  courseCode: string;
  courseTitle: string;
  department: string;
  roomNumber: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  instructor: string;
  section: string;
  semester: string;
}

export interface EventInput {
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  roomNumber: string | null;
  venueLabel: string;
  organizer: string;
  capacity: number;
  status: string;
}

export interface AssignmentInput {
  courseCode: string;
  courseTitle: string;
  department: string;
  title: string;
  description: string | null;
  assignedAt: string;
  dueAt: string;
  submissionPlatform: string;
  marks: number;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  priority: string;
  postedBy: string;
  expiresAt: string | null;
}

export interface DashboardData {
  schedules: Schedule[];
  rooms: Room[];
  events: CampusEvent[];
  assignments: Assignment[];
  announcements: Announcement[];
}
export type PendingAction =
  | {
      type: "ROOM_BOOKING";
      summary: string;
      payload: { roomId: string; roomNumber: string; date: string; startTime: string; endTime: string; purpose: string };
    }
  | {
      type: "ROOM_BOOKING_CANCEL";
      summary: string;
      payload: { roomId: string; bookingId: string; roomNumber: string; date: string; startTime: string; endTime: string };
    }
  | { type: "EVENT_REGISTRATION"; summary: string; payload: { eventId: string; eventName: string } }
  | { type: "EVENT_REGISTRATION_CANCEL"; summary: string; payload: { eventId: string; eventName: string } }
  | {
      type: "ASSIGNMENT_STATUS_UPDATE";
      summary: string;
      payload: { assignmentId: string; assignmentTitle: string; status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" };
    };

export interface RoomBookingSummary {
  id: string;
  purpose: string;
  startsAt: string;
  endsAt: string;
  room: Pick<Room, "id" | "number">;
}

export interface ActionConfirmation<T = unknown> {
  action: PendingAction["type"];
  status: "CONFIRMED";
  message: string;
  confirmedAt: string;
  result: T;
}

export interface AgentReply { message: string; toolsUsed: string[]; sessionId: string; pendingAction?: PendingAction }
