"use client";

import { CalendarCheck2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useZodForm } from "../../hooks/useZodForm";
import { api, ApiClientError } from "../../services/api";
import type { Room } from "../../types/api";
import { Button } from "../shared/ui/button";
import { FormBanner, FormField, FormGrid } from "../shared/ui/form";
import { Input } from "../shared/ui/input";
import { Modal } from "../shared/ui/modal";

const bookingFormSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid start time"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid end time"),
    purpose: z.string().trim().min(3, "Purpose must be at least 3 characters").max(255)
  })
  .refine((value) => value.startTime < value.endTime, { message: "Must be after start time", path: ["endTime"] });

export function RoomBookingModal({ room, onClose, onBooked }: { room: Room; onClose: () => void; onBooked: () => void }) {
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const form = useZodForm(bookingFormSchema, {
    date: tomorrow.toISOString().slice(0, 10),
    startTime: "14:00",
    endTime: "15:00",
    purpose: "Group study session"
  });

  async function onSubmit() {
    await form.handleSubmit(async (data) => {
      try {
        const receipt = await api.bookRoom(room.id, data);
        setConfirmationMessage(receipt.message);
        setTimeout(onBooked, 1200);
      } catch (error) {
        throw new Error(error instanceof ApiClientError ? error.message : "Could not book this room. Please try again.");
      }
    });
  }

  const isDone = confirmationMessage !== null;

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={`Book room ${room.number}`}
      description="Reserve this space for a class, study session, or meeting. Conflicts are checked before saving."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={form.isSubmitting}>Cancel</Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={form.isSubmitting || isDone}>
            <CalendarCheck2 className="size-4" />
            {isDone ? "Booked" : form.isSubmitting ? "Booking…" : "Confirm booking"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        {form.submitError && <FormBanner>{form.submitError}</FormBanner>}
        {confirmationMessage && (
          <div role="status" className="flex items-center gap-2 rounded-md border border-success/20 bg-success/5 p-3 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" /> {confirmationMessage}
          </div>
        )}
        <FormField label="Date" htmlFor="booking-date" error={form.errors.date}>
          <Input id="booking-date" type="date" value={form.values.date} onChange={(e) => form.setValue("date", e.target.value)} invalid={!!form.errors.date} disabled={isDone} />
        </FormField>
        <FormGrid>
          <FormField label="Start time" htmlFor="booking-start" error={form.errors.startTime}>
            <Input id="booking-start" type="time" value={form.values.startTime} onChange={(e) => form.setValue("startTime", e.target.value)} invalid={!!form.errors.startTime} disabled={isDone} />
          </FormField>
          <FormField label="End time" htmlFor="booking-end" error={form.errors.endTime}>
            <Input id="booking-end" type="time" value={form.values.endTime} onChange={(e) => form.setValue("endTime", e.target.value)} invalid={!!form.errors.endTime} disabled={isDone} />
          </FormField>
        </FormGrid>
        <FormField label="Purpose" htmlFor="booking-purpose" error={form.errors.purpose}>
          <Input id="booking-purpose" value={form.values.purpose} onChange={(e) => form.setValue("purpose", e.target.value)} invalid={!!form.errors.purpose} placeholder="e.g. CSE 480 capstone meeting" disabled={isDone} />
        </FormField>
      </form>
    </Modal>
  );
}
