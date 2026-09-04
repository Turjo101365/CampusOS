"use client";

import { z } from "zod";
import { api, ApiClientError } from "../../services/api";
import { useZodForm } from "../../hooks/useZodForm";
import type { CampusEvent } from "../../types/api";
import { isoToLocalInput, localInputToIso } from "../../utils/format";
import { Button } from "../shared/ui/button";
import { FormBanner, FormField, FormGrid } from "../shared/ui/form";
import { Input, Textarea } from "../shared/ui/input";
import { Modal } from "../shared/ui/modal";
import { Select } from "../shared/ui/select";

const statusOptions = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
];

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, `${label} must be between ${min} and ${max}`);

const eventFormSchema = z
  .object({
    name: z.string().trim().min(3, "Required").max(190),
    description: z.string().trim().max(5000),
    startsAtLocal: z.string().min(1, "Required"),
    endsAtLocal: z.string().min(1, "Required"),
    roomNumber: z.string().trim().max(20),
    venueLabel: z.string().trim().min(1, "Required").max(120),
    organizer: z.string().trim().min(2, "Required").max(120),
    capacity: wholeNumber("Capacity", 1, 100000),
    status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"])
  })
  .refine((value) => value.startsAtLocal < value.endsAtLocal, { message: "Must be after start time", path: ["endsAtLocal"] })
  .transform(({ startsAtLocal, endsAtLocal, description, roomNumber, ...rest }) => ({
    ...rest,
    description: description.trim() ? description.trim() : null,
    roomNumber: roomNumber.trim() ? roomNumber.trim() : null,
    startsAt: localInputToIso(startsAtLocal),
    endsAt: localInputToIso(endsAtLocal)
  }));

function toFormValues(event?: CampusEvent) {
  return {
    name: event?.name ?? "",
    description: event?.description ?? "",
    startsAtLocal: isoToLocalInput(event?.startsAt),
    endsAtLocal: isoToLocalInput(event?.endsAt),
    roomNumber: event?.room?.number ?? "",
    venueLabel: event?.venueLabel ?? "",
    organizer: event?.organizer ?? "",
    capacity: String(event?.capacity ?? ""),
    status: (event?.status ?? "UPCOMING") as "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  };
}

export function EventForm({
  mode,
  event,
  onClose,
  onSaved
}: {
  mode: "create" | "edit";
  event?: CampusEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useZodForm(eventFormSchema, toFormValues(event));

  async function onSubmit() {
    await form.handleSubmit(async (data) => {
      try {
        if (mode === "edit" && event) await api.updateEvent(event.id, data);
        else await api.createEvent(data);
        onSaved();
      } catch (error) {
        throw new Error(error instanceof ApiClientError ? error.message : "Could not save this event. Please try again.");
      }
    });
  }

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={mode === "edit" ? "Edit event" : "Add event"}
      description="Events are checked against room bookings when a room number is set."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={form.isSubmitting}>Cancel</Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Add event"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event_) => { event_.preventDefault(); void onSubmit(); }}>
        {form.submitError && <FormBanner>{form.submitError}</FormBanner>}
        <FormField label="Event name" htmlFor="evt-name" error={form.errors.name}>
          <Input id="evt-name" value={form.values.name} onChange={(e) => form.setValue("name", e.target.value)} invalid={!!form.errors.name} />
        </FormField>
        <FormField label="Description" htmlFor="evt-description" error={form.errors.description} hint="Optional">
          <Textarea id="evt-description" value={form.values.description} onChange={(e) => form.setValue("description", e.target.value)} invalid={!!form.errors.description} />
        </FormField>
        <FormGrid>
          <FormField label="Starts at" htmlFor="evt-starts" error={form.errors.startsAtLocal}>
            <Input id="evt-starts" type="datetime-local" value={form.values.startsAtLocal} onChange={(e) => form.setValue("startsAtLocal", e.target.value)} invalid={!!form.errors.startsAtLocal} />
          </FormField>
          <FormField label="Ends at" htmlFor="evt-ends" error={form.errors.endsAtLocal}>
            <Input id="evt-ends" type="datetime-local" value={form.values.endsAtLocal} onChange={(e) => form.setValue("endsAtLocal", e.target.value)} invalid={!!form.errors.endsAtLocal} />
          </FormField>
          <FormField label="Venue label" htmlFor="evt-venue" error={form.errors.venueLabel}>
            <Input id="evt-venue" value={form.values.venueLabel} onChange={(e) => form.setValue("venueLabel", e.target.value)} invalid={!!form.errors.venueLabel} placeholder="Auditorium" />
          </FormField>
          <FormField label="Room number" htmlFor="evt-room" error={form.errors.roomNumber} hint="Optional — enables booking conflict checks">
            <Input id="evt-room" value={form.values.roomNumber} onChange={(e) => form.setValue("roomNumber", e.target.value)} invalid={!!form.errors.roomNumber} placeholder="7A07" />
          </FormField>
          <FormField label="Organizer" htmlFor="evt-organizer" error={form.errors.organizer}>
            <Input id="evt-organizer" value={form.values.organizer} onChange={(e) => form.setValue("organizer", e.target.value)} invalid={!!form.errors.organizer} />
          </FormField>
          <FormField label="Capacity" htmlFor="evt-capacity" error={form.errors.capacity}>
            <Input id="evt-capacity" type="number" min={1} value={form.values.capacity} onChange={(e) => form.setValue("capacity", e.target.value)} invalid={!!form.errors.capacity} />
          </FormField>
          <FormField label="Status" htmlFor="evt-status" error={form.errors.status}>
            <Select id="evt-status" options={statusOptions} value={form.values.status} onChange={(e) => form.setValue("status", e.target.value as typeof form.values.status)} invalid={!!form.errors.status} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}
