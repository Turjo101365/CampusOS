import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { eventsService } from "./events.service.js";
import type { EventInput, EventListQuery, EventUpdateInput } from "./events.validation.js";

export const eventsController = {
  async list(request: Request, response: Response) {
    const query = request.query as EventListQuery;
    query.userId ??= (request as AuthenticatedRequest).auth?.userId;
    return sendSuccess(response, await eventsService.list(query), "Events retrieved");
  },
  async get(request: Request, response: Response) { return sendSuccess(response, await eventsService.getById(request.params.id as string), "Event retrieved"); },
  async create(request: Request, response: Response) { return sendSuccess(response, await eventsService.create(request.body as EventInput), "Event created", 201); },
  async update(request: Request, response: Response) { return sendSuccess(response, await eventsService.update(request.params.id as string, request.body as EventUpdateInput), "Event updated"); },
  async remove(request: Request, response: Response) { await eventsService.remove(request.params.id as string); return sendSuccess(response, null, "Event deleted"); },
  async register(request: Request, response: Response) {
    const actorUserId = (request as AuthenticatedRequest).auth.userId;
    const targetUserId = request.body.userId ?? actorUserId;
    return sendSuccess(
      response,
      await eventsService.register(request.params.id as string, actorUserId, targetUserId),
      "Event registration confirmed",
      201
    );
  },
  async cancelRegistration(request: Request, response: Response) {
    const actorUserId = (request as AuthenticatedRequest).auth.userId;
    const targetUserId = (request.query.userId as string | undefined) ?? actorUserId;
    return sendSuccess(
      response,
      await eventsService.cancelRegistration(request.params.id as string, actorUserId, targetUserId),
      "Event registration cancelled"
    );
  }
};
