"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { Announcement } from "../../types/api";
import { formatDateTime, titleCase } from "../../utils/format";
import { EmptyState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { ConfirmDialog } from "../shared/ui/confirm-dialog";
import { AnnouncementForm } from "../announcements/announcement-form";

type FormState = { mode: "create" } | { mode: "edit"; announcement: Announcement };

export function AnnouncementsList({ announcements, onMutated }: { announcements: Announcement[]; onMutated: () => void }) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAnnouncement(pendingDelete.id);
      setPendingDelete(null);
      onMutated();
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : "Could not delete this announcement.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="size-4" /> Add announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState label="No active announcements" />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <article key={item.id} className="glass-surface rounded-xl p-5 transition-standard hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={item.priority === "HIGH" || item.priority === "URGENT" ? "bg-rose-50 text-rose-700" : undefined}>{titleCase(item.priority)}</Badge>
                <span className="text-xs text-muted-foreground">Posted {formatDateTime(item.publishedAt)} by {item.postedBy}</span>
              </div>
              <h3 className="mt-3 font-bold">{item.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{item.body}</p>
              <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormState({ mode: "edit", announcement: item })}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => setPendingDelete(item)}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formState && (
        <AnnouncementForm
          mode={formState.mode}
          announcement={formState.mode === "edit" ? formState.announcement : undefined}
          onClose={() => setFormState(null)}
          onSaved={() => { setFormState(null); onMutated(); }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDeleteError(null); } }}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="This permanently removes the announcement. This cannot be undone."
        error={deleteError}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
