"use client";

import { z } from "zod";
import { api, ApiClientError } from "../../services/api";
import { useZodForm } from "../../hooks/useZodForm";
import type { Room } from "../../types/api";
import { Button } from "../shared/ui/button";
import { FormBanner, FormField, FormGrid } from "../shared/ui/form";
import { Input } from "../shared/ui/input";
import { Modal } from "../shared/ui/modal";
import { Select } from "../shared/ui/select";

const roomTypeOptions = [
  { value: "CLASSROOM", label: "Classroom" },
  { value: "LAB", label: "Lab" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "STUDY", label: "Study" }
];
const roomStatusOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "CLOSED", label: "Closed" }
];

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^-?\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, `${label} must be between ${min} and ${max}`);

const roomFormSchema = z
  .object({
    number: z.string().trim().min(1, "Room number is required").max(20),
    type: z.enum(["CLASSROOM", "LAB", "SEMINAR", "AUDITORIUM", "STUDY"], { message: "Select a room type" }),
    capacity: wholeNumber("Capacity", 1, 5000),
    floor: wholeNumber("Floor", -5, 200),
    status: z.enum(["AVAILABLE", "MAINTENANCE", "CLOSED"]),
    featuresText: z.string()
  })
  .transform(({ featuresText, ...rest }) => ({
    ...rest,
    features: featuresText.split(",").map((feature) => feature.trim()).filter(Boolean)
  }));

function toFormValues(room?: Room) {
  return {
    number: room?.number ?? "",
    type: (room?.type ?? "CLASSROOM") as "CLASSROOM" | "LAB" | "SEMINAR" | "AUDITORIUM" | "STUDY",
    capacity: String(room?.capacity ?? ""),
    floor: String(room?.floor ?? ""),
    status: (room?.status ?? "AVAILABLE") as "AVAILABLE" | "MAINTENANCE" | "CLOSED",
    featuresText: room?.features.map((feature) => feature.name).join(", ") ?? ""
  };
}

export function RoomForm({ mode, room, onClose, onSaved }: { mode: "create" | "edit"; room?: Room; onClose: () => void; onSaved: () => void }) {
  const form = useZodForm(roomFormSchema, toFormValues(room));

  async function onSubmit() {
    await form.handleSubmit(async (data) => {
      try {
        if (mode === "edit" && room) await api.updateRoom(room.id, data);
        else await api.createRoom(data);
        onSaved();
      } catch (error) {
        throw new Error(error instanceof ApiClientError ? error.message : "Could not save this room. Please try again.");
      }
    });
  }

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={mode === "edit" ? `Edit room ${room?.number ?? ""}` : "Add room"}
      description="Rooms power schedule, event, and booking availability checks."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={form.isSubmitting}>Cancel</Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Add room"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        {form.submitError && <FormBanner>{form.submitError}</FormBanner>}
        <FormGrid>
          <FormField label="Room number" htmlFor="room-number" error={form.errors.number}>
            <Input id="room-number" value={form.values.number} onChange={(e) => form.setValue("number", e.target.value)} invalid={!!form.errors.number} placeholder="7A07" />
          </FormField>
          <FormField label="Type" htmlFor="room-type" error={form.errors.type}>
            <Select id="room-type" options={roomTypeOptions} value={form.values.type} onChange={(e) => form.setValue("type", e.target.value as typeof form.values.type)} invalid={!!form.errors.type} />
          </FormField>
          <FormField label="Capacity" htmlFor="room-capacity" error={form.errors.capacity}>
            <Input id="room-capacity" type="number" min={1} value={form.values.capacity} onChange={(e) => form.setValue("capacity", e.target.value)} invalid={!!form.errors.capacity} />
          </FormField>
          <FormField label="Floor" htmlFor="room-floor" error={form.errors.floor}>
            <Input id="room-floor" type="number" value={form.values.floor} onChange={(e) => form.setValue("floor", e.target.value)} invalid={!!form.errors.floor} />
          </FormField>
          <FormField label="Status" htmlFor="room-status" error={form.errors.status}>
            <Select id="room-status" options={roomStatusOptions} value={form.values.status} onChange={(e) => form.setValue("status", e.target.value as typeof form.values.status)} invalid={!!form.errors.status} />
          </FormField>
        </FormGrid>
        <FormField label="Features" htmlFor="room-features" hint="Comma-separated, e.g. projector, ac, whiteboard">
          <Input id="room-features" value={form.values.featuresText} onChange={(e) => form.setValue("featuresText", e.target.value)} placeholder="projector, ac" />
        </FormField>
      </form>
    </Modal>
  );
}
