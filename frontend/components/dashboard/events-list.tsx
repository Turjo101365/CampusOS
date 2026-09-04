"use client";

import { Calendar, CheckCircle2, MapPin, Pencil, Plus, Trash2, UserCheck, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { CampusEvent } from "../../types/api";
import { formatDateTime, titleCase } from "../../utils/format";
import { EmptyState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { ConfirmDialog } from "../shared/ui/confirm-dialog";
import { EventForm } from "../events/event-form";

type FormState = { mode: "create" } | { mode: "edit"; event: CampusEvent };

export function EventsList({ events, onMutated }: { events: CampusEvent[]; onMutated: () => void }) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CampusEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleRegister(event: CampusEvent): Promise<void> {
    setRegisteringId(event.id);
    setFeedback(null);
    try {
      const receipt = await api.registerEvent(event.id);
      setFeedback({ type: "success", message: receipt.message });
      onMutated();
      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Could not register for this event."
      });
    } finally {
      setRegisteringId(null);
    }
  }

  async function handleCancelRegistration(event: CampusEvent): Promise<void> {
    setCancellingId(event.id);
    setFeedback(null);
    try {
      const receipt = await api.cancelEventRegistration(event.id);
      setFeedback({ type: "success", message: receipt.message });
      onMutated();
      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Could not cancel this registration."
      });
    } finally {
      setCancellingId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteEvent(pendingDelete.id);
      setPendingDelete(null);
      onMutated();
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : "Could not delete this event.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="size-4" /> Add event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState label="No campus events scheduled" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {events.map((event) => {
            const isRegistered = (event.registrations?.length ?? 0) > 0;
            const isUpcoming = event.status === "UPCOMING" && new Date(event.startsAt) > new Date();
            const isFull = event._count.registrations >= event.capacity;

            return (
              <article key={event.id} className="glass-surface rounded-xl p-5 transition-standard hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold">{event.name}</h3>
                  <Badge>{titleCase(event.status)}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5"><Calendar className="size-4 text-muted-foreground" />{formatDateTime(event.startsAt)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="size-4 text-muted-foreground" />{event.venueLabel}</span>
                  <span className="flex items-center gap-1.5"><Users className="size-4 text-muted-foreground" />{event._count.registrations}/{event.capacity}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div>
                    {isRegistered ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="mr-1 size-3.5" /> Registered
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleCancelRegistration(event)}
                          disabled={cancellingId !== null}
                        >
                          <UserMinus className="size-3.5" />
                          {cancellingId === event.id ? "Cancelling…" : "Cancel"}
                        </Button>
                      </div>
                    ) : isUpcoming && !isFull ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleRegister(event)}
                        disabled={registeringId !== null}
                      >
                        <UserCheck className="size-3.5" />
                        {registeringId === event.id ? "Registering…" : "Register"}
                      </Button>
                    ) : isFull ? (
                      <span className="text-xs font-medium text-amber-600">Event full</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Registration closed</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormState({ mode: "edit", event })}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => setPendingDelete(event)}>
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formState && (
        <EventForm
          mode={formState.mode}
          event={formState.mode === "edit" ? formState.event : undefined}
          onClose={() => setFormState(null)}
          onSaved={() => { setFormState(null); onMutated(); }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDeleteError(null); } }}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        description="This permanently removes the event and its registrations. This cannot be undone."
        error={deleteError}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
