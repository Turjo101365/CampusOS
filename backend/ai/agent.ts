import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { environment } from "../config/environment.js";
import { AppError } from "../utils/AppError.js";
import { isActionProposalResult, type PendingAction } from "./actionProposals.js";
import { chatMemoryService } from "./chatMemory.service.js";
import { CAMPUS_ASSISTANT_PROMPT } from "./prompts.js";
import { campusTools, executeCampusTool } from "./tools.js";

const MAX_TOOL_ROUNDS = 5;

/** Gemini's OpenAI-compatible endpoint speaks the standard Chat Completions API. */
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const chatCompletionTools: ChatCompletionTool[] = campusTools.map((tool) => ({
  type: "function",
  function: { name: tool.name, description: tool.description, parameters: tool.parameters as Record<string, unknown> }
}));

const RATE_LIMIT_RETRY_DELAYS_MS = [1500, 4000, 9000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Free-tier Gemini keys have low per-minute request limits, so a normal
 * multi-round tool-calling turn can legitimately hit a transient 429.
 * Retry with backoff before surfacing it as a real failure.
 */
async function createChatCompletion(
  client: OpenAI,
  params: Parameters<OpenAI["chat"]["completions"]["create"]>[0]
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await client.chat.completions.create(params) as OpenAI.Chat.Completions.ChatCompletion;
    } catch (error) {
      const isRateLimited = error instanceof OpenAI.APIError && error.status === 429;
      if (!isRateLimited || attempt === RATE_LIMIT_RETRY_DELAYS_MS.length) {
        if (isRateLimited) {
          throw new AppError(
            "The AI assistant is temporarily rate-limited. Please wait a few seconds and try again.",
            429,
            "AI_RATE_LIMITED"
          );
        }
        throw error;
      }
      await sleep(RATE_LIMIT_RETRY_DELAYS_MS[attempt] ?? 5000);
    }
  }
  throw new AppError("The AI assistant is unavailable", 502, "AI_UNAVAILABLE");
}

export interface AgentReply {
  message: string;
  toolsUsed: string[];
  sessionId: string;
  pendingAction?: PendingAction;
}

export interface ToolEvent {
  type: "start" | "end";
  tool: string;
}

export async function runCampusAgent(
  message: string,
  sessionId: string,
  currentUserId: string,
  onToolEvent?: (event: ToolEvent) => void
): Promise<AgentReply> {
  if (!environment.GEMINI_API_KEY) {
    throw new AppError("The AI assistant is not configured. Add GEMINI_API_KEY to .env.", 503, "AI_NOT_CONFIGURED");
  }

  const client = new OpenAI({ apiKey: environment.GEMINI_API_KEY, baseURL: GEMINI_BASE_URL });

  // 1. session_id is already received as a parameter.
  // 2. Load previous messages for this session from MySQL.
  const history = await chatMemoryService.getConversationHistory(sessionId, currentUserId);
  // 3. Add the new user message — persisted immediately and included in this call's input.
  await chatMemoryService.saveMessage(sessionId, currentUserId, "user", message);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: CAMPUS_ASSISTANT_PROMPT },
    ...history.map((entry) => ({ role: entry.role, content: entry.content }) as ChatCompletionMessageParam),
    { role: "user", content: message }
  ];
  const toolsUsed: string[] = [];
  let pendingAction: PendingAction | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await createChatCompletion(client, {
      model: environment.GEMINI_MODEL,
      messages,
      tools: chatCompletionTools
    });

    const choice = response.choices[0];
    const assistantMessage = choice?.message;
    if (!assistantMessage) {
      throw new AppError("The AI assistant returned an empty response", 502, "AI_EMPTY_RESPONSE");
    }
    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls ?? [];
    if (toolCalls.length === 0) {
      const replyText = assistantMessage.content?.trim() || "I could not produce a response. Please try again.";
      // 5. Save the assistant's final response once tool execution is complete.
      await chatMemoryService.saveMessage(sessionId, currentUserId, "assistant", replyText);
      return {
        message: replyText,
        toolsUsed: [...new Set(toolsUsed)],
        sessionId,
        ...(pendingAction ? { pendingAction } : {})
      };
    }

    // 4. Execute tools — unchanged from the existing AI -> Tools -> Services -> Database chain.
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      toolsUsed.push(toolName);
      onToolEvent?.({ type: "start", tool: toolName });
      let output: unknown;
      try {
        output = await executeCampusTool(toolName, JSON.parse(toolCall.function.arguments), currentUserId);
        if (isActionProposalResult(output)) pendingAction = output.pendingAction;
      } catch (error) {
        output = {
          error: error instanceof Error ? error.message : "Tool execution failed",
          code: error instanceof AppError ? error.code : "TOOL_EXECUTION_ERROR"
        };
      }
      onToolEvent?.({ type: "end", tool: toolName });
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(output) });
    }
  }

  throw new AppError("The AI assistant exceeded its tool-call limit", 502, "AI_TOOL_LIMIT");
}
