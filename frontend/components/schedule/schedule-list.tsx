"use client";

import { Clock3, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { Schedule } from "../../types/api";
import { formatTime, titleCase } from "../../utils/format";
import { EmptyState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { ConfirmDialog } from "../shared/ui/confirm-dialog";
import { ScheduleForm } from "./schedule-form";

type FormState = { mode: "create" } | { mode: "edit"; schedule: Schedule };

export function ScheduleList({ schedules, compact = false, onMutated }: { schedules: Schedule[]; compact?: boolean; onMutated?: () => void }) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const interactive = !compact && !!onMutated;

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteSchedule(pendingDelete.id);
      setPendingDelete(null);
      onMutated?.();
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : "Could not delete this class.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {interactive && (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => setFormState({ mode: "create" })}>
            <Plus className="size-4" /> Add class
          </Button>
        </div>
      )}

      {schedules.length === 0 ? (
        <EmptyState label="No classes in this view" />
      ) : (
        <div className="divide-y">
          {schedules.slice(0, compact ? 5 : undefined).map((item) => (
            <article key={item.id} className="grid gap-2 py-4 first:pt-0 sm:grid-cols-[130px_1fr_auto_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold">{titleCase(item.dayOfWeek)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{formatTime(item.startTime)}–{formatTime(item.endTime)}</p>
              </div>
              <div>
                <p className="font-semibold">{item.course.code} · {item.course.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.instructor} · Section {item.section}</p>
              </div>
              <Badge className="w-fit"><MapPin className="mr-1 size-3" />{item.room.number}</Badge>
              {interactive && (
                <div className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label="Edit class" onClick={() => setFormState({ mode: "edit", schedule: item })}><Pencil className="size-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Delete class" className="text-destructive hover:bg-red-50" onClick={() => setPendingDelete(item)}><Trash2 className="size-3.5" /></Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {interactive && formState && (
        <ScheduleForm
          mode={formState.mode}
          schedule={formState.mode === "edit" ? formState.schedule : undefined}
          onClose={() => setFormState(null)}
          onSaved={() => { setFormState(null); onMutated?.(); }}
        />
      )}

      {interactive && (
        <ConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDeleteError(null); } }}
          title={`Delete ${pendingDelete?.course.code ?? "this"} class?`}
          description="This permanently removes the class from the schedule. This cannot be undone."
          error={deleteError}
          isLoading={isDeleting}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
