"use client";

import { Check, CheckCircle2, Clock3, Loader2, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { Assignment } from "../../types/api";
import { formatDateTime } from "../../utils/format";
import { EmptyState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { ConfirmDialog } from "../shared/ui/confirm-dialog";
import { AssignmentForm } from "../assignments/assignment-form";

type FormState = { mode: "create" } | { mode: "edit"; assignment: Assignment };

export function AssignmentsList({ assignments, onMutated }: { assignments: Assignment[]; onMutated: () => void }) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleStatusUpdate(assignmentId: string, status: "PENDING" | "IN_PROGRESS" | "SUBMITTED"): Promise<void> {
    setUpdatingId(assignmentId);
    setFeedback(null);
    try {
      const receipt = await api.updateAssignmentStatus(assignmentId, status);
      setFeedback({ type: "success", message: receipt.message });
      onMutated();
      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Could not update assignment status."
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAssignment(pendingDelete.id);
      setPendingDelete(null);
      onMutated();
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : "Could not delete this assignment.");
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
              ? "border border-success/20 bg-success/5 text-success"
              : "border border-destructive/20 bg-destructive/5 text-destructive"
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="size-4" /> Add assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState label="No assignments due" />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="divide-y">
            {assignments.map((item) => {
              const status = item.submissions?.[0]?.status ?? "PENDING";
              const isUpdating = updatingId === item.id;

              return (
                <article key={item.id} className="grid gap-3 p-4 sm:grid-cols-[110px_1fr_auto_auto] sm:items-center">
                  <Badge className="w-fit">{item.course.code}</Badge>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="size-4" />Due {formatDateTime(item.dueAt)} · {item.marks} marks</p>
                  </div>
                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <div className="flex items-center gap-1.5">
                      {status === "SUBMITTED" ? (
                        <Badge className="bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="mr-1 size-3.5" /> Submitted
                        </Badge>
                      ) : status === "IN_PROGRESS" ? (
                        <Badge className="bg-blue-50 text-blue-700">In Progress</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700">Pending</Badge>
                      )}
                      {isUpdating && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                    </div>
                    {status === "PENDING" && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => void handleStatusUpdate(item.id, "IN_PROGRESS")}
                          disabled={updatingId !== null}
                        >
                          <Play className="mr-1 size-3" /> Start
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => void handleStatusUpdate(item.id, "SUBMITTED")}
                          disabled={updatingId !== null}
                        >
                          <Check className="mr-1 size-3" /> Submit
                        </Button>
                      </div>
                    )}
                    {status === "IN_PROGRESS" && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="h-7 px-2 text-xs"
                          onClick={() => void handleStatusUpdate(item.id, "SUBMITTED")}
                          disabled={updatingId !== null}
                        >
                          <Check className="mr-1 size-3" /> Submit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => void handleStatusUpdate(item.id, "PENDING")}
                          disabled={updatingId !== null}
                        >
                          Pause
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="Edit assignment" onClick={() => setFormState({ mode: "edit", assignment: item })}><Pencil className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Delete assignment" className="text-destructive hover:bg-red-50" onClick={() => setPendingDelete(item)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {formState && (
        <AssignmentForm
          mode={formState.mode}
          assignment={formState.mode === "edit" ? formState.assignment : undefined}
          onClose={() => setFormState(null)}
          onSaved={() => { setFormState(null); onMutated(); }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDeleteError(null); } }}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="This permanently removes the assignment and its submissions. This cannot be undone."
        error={deleteError}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
