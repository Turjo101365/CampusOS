"use client";

import { useRef, useState } from "react";
import { api } from "../../services/api";
import type { PendingAction } from "../../types/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  pendingAction?: PendingAction;
  actionStatus?: "CONFIRMED" | "CANCELLED";
}

export interface ToolStep {
  tool: string;
  status: "running" | "done";
}

export function useAssistant(options?: { onActionConfirmed?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "Ask me about your classes, rooms, assignments, events, or campus announcements." }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [confirmingMessageId, setConfirmingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | undefined>(undefined);

  async function send(content: string): Promise<void> {
    const text = content.trim();
    if (!text || isSending) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);
    setIsSending(true);
    setError(null);
    setToolSteps([]);
    try {
      const reply = await api.streamMessage(text, sessionId.current, (event) => {
        setToolSteps((current) => {
          if (event.type === "start") return [...current, { tool: event.tool, status: "running" }];
          const lastRunning = current.map((step, index) => ({ step, index })).reverse()
            .find(({ step }) => step.tool === event.tool && step.status === "running");
          if (!lastRunning) return current;
          return current.map((step, index) => index === lastRunning.index ? { ...step, status: "done" } : step);
        });
      });
      sessionId.current = reply.sessionId;
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply.message,
        toolsUsed: reply.toolsUsed,
        pendingAction: reply.pendingAction
      }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assistant is unavailable");
    } finally {
      setIsSending(false);
      setToolSteps([]);
    }
  }

  async function confirmAction(messageId: string, action: PendingAction): Promise<void> {
    if (confirmingMessageId) return;
    setConfirmingMessageId(messageId);
    setError(null);
    try {
      const confirmation = await api.confirmAction(action);
      setMessages((current) => current.map((message) => message.id === messageId
        ? {
            ...message,
            pendingAction: undefined,
            actionStatus: "CONFIRMED",
            content: `${message.content}\n\n${confirmation.message}`
          }
        : message));
      options?.onActionConfirmed?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The action could not be completed");
    } finally {
      setConfirmingMessageId(null);
    }
  }

  function cancelAction(messageId: string): void {
    setMessages((current) => current.map((message) => message.id === messageId
      ? { ...message, pendingAction: undefined, actionStatus: "CANCELLED" }
      : message));
  }

  return { messages, isSending, toolSteps, confirmingMessageId, error, send, confirmAction, cancelAction, hasSession: sessionId.current !== undefined };
}
