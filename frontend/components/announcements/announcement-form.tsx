"use client";

import { z } from "zod";
import { api, ApiClientError } from "../../services/api";
import { useZodForm } from "../../hooks/useZodForm";
import type { Announcement } from "../../types/api";
import { isoToLocalInput, localInputToIso } from "../../utils/format";
import { Button } from "../shared/ui/button";
import { FormBanner, FormField, FormGrid } from "../shared/ui/form";
import { Input, Textarea } from "../shared/ui/input";
import { Modal } from "../shared/ui/modal";
import { Select } from "../shared/ui/select";

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" }
];

const announcementFormSchema = z
  .object({
    title: z.string().trim().min(3, "Required").max(190),
    body: z.string().trim().min(3, "Required").max(10000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    postedBy: z.string().trim().min(2, "Required").max(120),
    expiresAtLocal: z.string()
  })
  .transform(({ expiresAtLocal, ...rest }) => ({
    ...rest,
    expiresAt: expiresAtLocal ? localInputToIso(expiresAtLocal) : null
  }));

function toFormValues(announcement?: Announcement) {
  return {
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    priority: (announcement?.priority ?? "MEDIUM") as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    postedBy: announcement?.postedBy ?? "",
    expiresAtLocal: isoToLocalInput(announcement?.expiresAt)
  };
}

export function AnnouncementForm({
  mode,
  announcement,
  onClose,
  onSaved
}: {
  mode: "create" | "edit";
  announcement?: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useZodForm(announcementFormSchema, toFormValues(announcement));

  async function onSubmit() {
    await form.handleSubmit(async (data) => {
      try {
        if (mode === "edit" && announcement) await api.updateAnnouncement(announcement.id, data);
        else await api.createAnnouncement(data);
        onSaved();
      } catch (error) {
        throw new Error(error instanceof ApiClientError ? error.message : "Could not save this announcement. Please try again.");
      }
    });
  }

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={mode === "edit" ? "Edit announcement" : "Add announcement"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={form.isSubmitting}>Cancel</Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Add announcement"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        {form.submitError && <FormBanner>{form.submitError}</FormBanner>}
        <FormField label="Title" htmlFor="ann-title" error={form.errors.title}>
          <Input id="ann-title" value={form.values.title} onChange={(e) => form.setValue("title", e.target.value)} invalid={!!form.errors.title} />
        </FormField>
        <FormField label="Body" htmlFor="ann-body" error={form.errors.body}>
          <Textarea id="ann-body" value={form.values.body} onChange={(e) => form.setValue("body", e.target.value)} invalid={!!form.errors.body} />
        </FormField>
        <FormGrid>
          <FormField label="Priority" htmlFor="ann-priority" error={form.errors.priority}>
            <Select id="ann-priority" options={priorityOptions} value={form.values.priority} onChange={(e) => form.setValue("priority", e.target.value as typeof form.values.priority)} invalid={!!form.errors.priority} />
          </FormField>
          <FormField label="Posted by" htmlFor="ann-posted-by" error={form.errors.postedBy}>
            <Input id="ann-posted-by" value={form.values.postedBy} onChange={(e) => form.setValue("postedBy", e.target.value)} invalid={!!form.errors.postedBy} placeholder="Registrar's Office" />
          </FormField>
          <FormField label="Expires at" htmlFor="ann-expires" error={form.errors.expiresAtLocal} hint="Optional">
            <Input id="ann-expires" type="datetime-local" value={form.values.expiresAtLocal} onChange={(e) => form.setValue("expiresAtLocal", e.target.value)} invalid={!!form.errors.expiresAtLocal} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}
