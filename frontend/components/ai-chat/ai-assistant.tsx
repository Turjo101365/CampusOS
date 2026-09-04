"use client";

import { ArrowUp, Brain, Check, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAssistant, type ChatMessage, type ToolStep } from "../../features/ai-assistant/useAssistant";
import { cn } from "../../utils/cn";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";

const suggestions = ["What classes do I have on Wednesday?", "Book an available lab tomorrow from 2 PM to 4 PM", "Mark my next assignment in progress"];

const TOOL_LABELS: Record<string, string> = {
  getSchedule: "Analyzing your schedule",
  findAvailableRooms: "Finding available rooms",
  getUpcomingAssignments: "Checking deadlines",
  getCampusEvents: "Checking campus events",
  getAnnouncements: "Checking announcements",
  getMyRoomBookings: "Checking your room bookings",
  getMyEventRegistrations: "Checking your event registrations",
  proposeRoomBooking: "Preparing room booking",
  proposeRoomBookingCancellation: "Preparing booking cancellation",
  proposeEventRegistration: "Preparing event registration",
  proposeEventRegistrationCancellation: "Preparing registration cancellation",
  proposeAssignmentStatusUpdate: "Preparing assignment update"
};

function toolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? `Running ${tool}`;
}

/** Contextual follow-ups based on what the assistant just did — distinct from the static starter suggestions. */
function smartRecommendations(message: ChatMessage): string[] {
  if (message.pendingAction || message.actionStatus) return [];
  const tools = message.toolsUsed ?? [];
  if (tools.includes("findAvailableRooms")) return ["Book one of these rooms", "Check my schedule for conflicts"];
  if (tools.includes("getSchedule")) return ["Find a free room nearby", "What assignments are due this week?"];
  if (tools.includes("getUpcomingAssignments")) return ["Mark the nearest one in progress", "What's my schedule tomorrow?"];
  if (tools.includes("getCampusEvents")) return ["Register me for that event", "Any announcements about it?"];
  if (tools.includes("getAnnouncements")) return ["Show only urgent announcements", "What's on my schedule today?"];
  if (tools.includes("getMyRoomBookings")) return ["Cancel one of these bookings", "Find another available room"];
  if (tools.includes("getMyEventRegistrations")) return ["Cancel one of these registrations", "What else is happening on campus?"];
  return [];
}

const MEMORY_WINDOW = 10;

export function AiAssistant({
  onMutated,
  initialPrompt,
  onInitialPromptConsumed
}: {
  onMutated?: () => void;
  /** A prompt handed off from elsewhere in the app (e.g. the AI Planner) — sent once automatically on mount. */
  initialPrompt?: string;
  onInitialPromptConsumed?: () => void;
} = {}) {
  const { messages, isSending, toolSteps, confirmingMessageId, error, send, confirmAction, cancelAction } = useAssistant({
    onActionConfirmed: onMutated
  });
  const [draft, setDraft] = useState("");
  const hasSentInitialPrompt = useRef(false);

  useEffect(() => {
    if (initialPrompt && !hasSentInitialPrompt.current) {
      hasSentInitialPrompt.current = true;
      void send(initialPrompt);
      onInitialPromptConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  function submit(event: FormEvent) { event.preventDefault(); const value = draft; setDraft(""); void send(value); }

  const exchangedCount = messages.filter((message) => message.id !== "welcome").length;
  const memoryCount = Math.min(exchangedCount, MEMORY_WINDOW);

  return (
    <section className="glass-surface mx-auto flex h-[calc(100vh-190px)] min-h-[520px] max-w-4xl flex-col overflow-hidden rounded-xl">
      <div className="border-b border-border/70 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground shadow-soft">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold tracking-tight">Campus Intelligence</h2>
              <p className="text-xs text-muted-foreground">Grounded in live schedules, rooms, assignments &amp; events</p>
            </div>
          </div>
          {memoryCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground sm:flex" title="CampusOS remembers your recent conversation to keep answers in context">
              <Brain className="size-3.5" aria-hidden="true" />
              Remembering {memoryCount}{exchangedCount > MEMORY_WINDOW ? "+" : ""} {memoryCount === 1 ? "message" : "messages"}
            </span>
          )}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-6 py-6" aria-live="polite">
        {messages.map((message) => {
          const recommendations = message.role === "assistant" ? smartRecommendations(message) : [];
          return (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "assistant" ? (
                <div className="max-w-[88%] border-l-2 border-primary/50 pl-4">
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{message.content}</p>

                  {message.pendingAction && (
                    <div className="mt-3 rounded-lg border border-primary/20 bg-accent/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                        <ShieldCheck className="size-4 text-primary" /> Confirmation required
                      </div>
                      <p className="mt-1.5 text-sm text-foreground/90">{message.pendingAction.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Permissions and conflicts are checked again before saving.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void confirmAction(message.id, message.pendingAction!)} disabled={confirmingMessageId !== null}>
                          <Check className="size-4" />{confirmingMessageId === message.id ? "Confirming…" : "Confirm action"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancelAction(message.id)} disabled={confirmingMessageId !== null}>
                          <X className="size-4" />Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {message.actionStatus && (
                    <Badge className={cn("mt-3", message.actionStatus === "CONFIRMED" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      {message.actionStatus === "CONFIRMED" ? "Action confirmed" : "Action cancelled"}
                    </Badge>
                  )}

                  {message.toolsUsed?.length ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {message.toolsUsed.map((tool, index) => <Badge key={`${tool}-${index}`} className="bg-muted text-muted-foreground">{toolLabel(tool)}</Badge>)}
                    </div>
                  ) : null}

                  {recommendations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommendations.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void send(suggestion)}
                          disabled={isSending || confirmingMessageId !== null}
                          className="min-h-8 rounded-full border border-primary/25 bg-card/60 px-3 text-xs font-medium text-primary transition-standard hover:bg-accent disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[80%] rounded-xl bg-accent px-4 py-3 text-[15px] leading-7 text-accent-foreground">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
            </div>
          );
        })}

        {isSending && <ToolStatusFeed steps={toolSteps} />}
        {error && <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
      </div>

      <div className="border-t border-border/70 p-5">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              disabled={isSending || confirmingMessageId !== null}
              className="min-h-9 shrink-0 rounded-full border border-border/70 bg-card/60 px-3.5 text-xs font-medium text-foreground/90 transition-standard hover:border-primary/30 hover:bg-accent disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-border bg-card/70 p-1.5 shadow-soft transition-standard focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/25">
          <label className="sr-only" htmlFor="assistant-message">Ask CampusOS</label>
          <input
            id="assistant-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about your campus…"
            maxLength={4000}
            className="min-h-10 flex-1 bg-transparent px-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || isSending || confirmingMessageId !== null} aria-label="Send message">
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}

/** Live tool-execution status feed — reflects the agent's real, currently-running backend tool calls. */
function ToolStatusFeed({ steps }: { steps: ToolStep[] }) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-primary/30 pl-4" role="status" aria-busy="true">
      <div className="min-w-0 flex-1 space-y-2">
        {steps.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" /> Understanding your question…
          </p>
        ) : (
          steps.map((step, index) => (
            <p key={`${step.tool}-${index}`} className={cn("flex items-center gap-2 text-sm transition-standard", step.status === "done" ? "text-muted-foreground" : "text-foreground")}>
              {step.status === "done" ? <Check className="size-3.5 shrink-0 text-success" /> : <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />}
              {toolLabel(step.tool)}…
            </p>
          ))
        )}
      </div>
    </div>
  );
}
