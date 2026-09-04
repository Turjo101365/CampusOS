import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { runCampusAgent } from "./agent.js";
import { chatMemoryService } from "./chatMemory.service.js";
import { campusTools } from "./tools.js";

export const aiController = {
  async chat(request: Request, response: Response) {
    const sessionId = request.body.sessionId ?? randomUUID();
    const currentUserId = (request as AuthenticatedRequest).auth.userId;
    return sendSuccess(response, await runCampusAgent(request.body.message, sessionId, currentUserId), "AI response generated");
  },

  /**
   * Same agent call as `chat`, but streams live tool-execution progress over
   * Server-Sent Events before the final answer — powers the assistant UI's
   * "Analyzing your schedule…" / "Finding available rooms…" status feed.
   */
  async streamChat(request: Request, response: Response) {
    const sessionId = request.body.sessionId ?? randomUUID();
    const currentUserId = (request as AuthenticatedRequest).auth.userId;

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders();

    const writeEvent = (event: string, data: unknown): void => {
      response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const reply = await runCampusAgent(request.body.message, sessionId, currentUserId, (toolEvent) => {
        writeEvent("progress", toolEvent);
      });
      writeEvent("result", reply);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("The AI assistant is unavailable");
      writeEvent("error", { message: appError.message, code: appError.code });
    } finally {
      response.end();
    }
  },

  async listTools(_request: Request, response: Response) {
    return sendSuccess(response, campusTools.map(({ name, description }) => ({ name, description })), "AI tools retrieved");
  },
  async clearSession(request: Request, response: Response) {
    const currentUserId = (request as AuthenticatedRequest).auth.userId;
    await chatMemoryService.clearSession(request.params.sessionId as string, currentUserId);
    return sendSuccess(response, null, "AI session cleared");
  }
};
