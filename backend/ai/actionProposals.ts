import { z } from "zod";

const roomBookingProposalSchema = z.object({
  roomId: z.string().min(1),
  roomNumber: z.string().min(1),
  date: z.string().date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  purpose: z.string().trim().min(3).max(255)
});

const eventRegistrationProposalSchema = z.object({
  eventId: z.string().min(1),
  eventName: z.string().min(1)
});

const assignmentStatusProposalSchema = z.object({
  assignmentId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "SUBMITTED"])
});

export type PendingAction =
  | { type: "ROOM_BOOKING"; summary: string; payload: z.infer<typeof roomBookingProposalSchema> }
  | { type: "EVENT_REGISTRATION"; summary: string; payload: z.infer<typeof eventRegistrationProposalSchema> }
  | { type: "ASSIGNMENT_STATUS_UPDATE"; summary: string; payload: z.infer<typeof assignmentStatusProposalSchema> };

export interface ActionProposalResult {
  kind: "ACTION_CONFIRMATION_REQUIRED";
  pendingAction: PendingAction;
}

export function createActionProposal(name: string, rawArguments: unknown): ActionProposalResult {
  if (name === "proposeRoomBooking") {
    const payload = roomBookingProposalSchema.parse(rawArguments);
    return {
      kind: "ACTION_CONFIRMATION_REQUIRED",
      pendingAction: {
        type: "ROOM_BOOKING",
        summary: `Book room ${payload.roomNumber} on ${payload.date} from ${payload.startTime} to ${payload.endTime} for ${payload.purpose}?`,
        payload
      }
    };
  }
  if (name === "proposeEventRegistration") {
    const payload = eventRegistrationProposalSchema.parse(rawArguments);
    return {
      kind: "ACTION_CONFIRMATION_REQUIRED",
      pendingAction: {
        type: "EVENT_REGISTRATION",
        summary: `Register for ${payload.eventName}?`,
        payload
      }
    };
  }
  if (name === "proposeAssignmentStatusUpdate") {
    const payload = assignmentStatusProposalSchema.parse(rawArguments);
    return {
      kind: "ACTION_CONFIRMATION_REQUIRED",
      pendingAction: {
        type: "ASSIGNMENT_STATUS_UPDATE",
        summary: `Change ${payload.assignmentTitle} to ${payload.status.toLowerCase().replace("_", " ")}?`,
        payload
      }
    };
  }
  throw new Error(`Unknown action proposal: ${name}`);
}

export function isActionProposalResult(value: unknown): value is ActionProposalResult {
  return typeof value === "object" && value !== null && (value as ActionProposalResult).kind === "ACTION_CONFIRMATION_REQUIRED";
}
