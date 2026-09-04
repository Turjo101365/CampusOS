import type { User, UserRole } from "@prisma/client";
import { AppError } from "../../utils/AppError.js";
import { usersService } from "./users.service.js";

export type OperationalAction = "ROOM_BOOK" | "EVENT_REGISTER" | "ASSIGNMENT_STATUS_UPDATE";

const allowedRoles: Record<OperationalAction, readonly UserRole[]> = {
  ROOM_BOOK: ["STUDENT", "FACULTY", "ADMIN"],
  EVENT_REGISTER: ["STUDENT", "FACULTY", "ADMIN"],
  ASSIGNMENT_STATUS_UPDATE: ["STUDENT"]
};

export const authorizationService = {
  async requireActor(externalUserId: string, action: OperationalAction): Promise<User> {
    const actor = await usersService.getById(externalUserId);
    if (!allowedRoles[action].includes(actor.role)) {
      throw new AppError("You do not have permission to perform this action", 403, "ACTION_FORBIDDEN");
    }
    return actor;
  },

  requireSelfOrAdmin(actor: User, targetExternalUserId: string): void {
    if (actor.externalId !== targetExternalUserId && actor.role !== "ADMIN") {
      throw new AppError("You cannot perform this action for another user", 403, "TARGET_USER_FORBIDDEN");
    }
  }
};
