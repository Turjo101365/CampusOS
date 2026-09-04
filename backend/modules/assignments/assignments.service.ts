import type { AssignmentStatus } from "@prisma/client";
import { AppError } from "../../utils/AppError.js";
import { createActionConfirmation } from "../../utils/actionConfirmation.js";
import { authorizationService } from "../users/authorization.service.js";
import { assignmentsModel } from "./assignments.model.js";
import type { AssignmentInput, AssignmentListQuery, AssignmentUpdateInput } from "./assignments.validation.js";

const allowedTransitions: Record<AssignmentStatus, readonly AssignmentStatus[]> = {
  PENDING: ["IN_PROGRESS", "SUBMITTED"],
  IN_PROGRESS: ["PENDING", "SUBMITTED"],
  SUBMITTED: [],
  GRADED: []
};

export const assignmentsService = {
  list(query: AssignmentListQuery = {}) { return assignmentsModel.findMany(query); },
  async getById(id: string) {
    const assignment = await assignmentsModel.findById(id);
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    return assignment;
  },
  create(input: AssignmentInput) { return assignmentsModel.create(input); },
  async update(id: string, input: AssignmentUpdateInput) { await this.getById(id); return assignmentsModel.update(id, input); },
  async remove(id: string) { await this.getById(id); await assignmentsModel.delete(id); },
  async setStatus(id: string, externalUserId: string, status: AssignmentStatus) {
    await authorizationService.requireActor(externalUserId, "ASSIGNMENT_STATUS_UPDATE");
    const assignment = await this.getById(id);
    if (!await assignmentsModel.isUserEnrolled(id, externalUserId)) {
      throw new AppError("You are not enrolled in this assignment's course", 403, "ASSIGNMENT_ACCESS_FORBIDDEN");
    }
    if (status === "GRADED") {
      throw new AppError("Students cannot mark assignments as graded", 403, "STATUS_FORBIDDEN");
    }
    const existing = await assignmentsModel.findSubmission(id, externalUserId);
    const currentStatus: AssignmentStatus = existing?.status ?? "PENDING";
    if (status !== currentStatus && !allowedTransitions[currentStatus].includes(status)) {
      throw new AppError(
        `Assignment status cannot change from ${currentStatus} to ${status}`,
        409,
        "INVALID_STATUS_TRANSITION"
      );
    }
    if (status !== currentStatus && assignment.dueAt <= new Date()) {
      throw new AppError("The assignment deadline has passed", 409, "ASSIGNMENT_DEADLINE_PASSED");
    }
    const submission = status === currentStatus && existing
      ? existing
      : await assignmentsModel.setStatus(id, externalUserId, status);
    return createActionConfirmation(
      "ASSIGNMENT_STATUS_UPDATE",
      `${assignment.title} is now ${status.toLowerCase().replace("_", " ")}.`,
      submission
    );
  }
};
