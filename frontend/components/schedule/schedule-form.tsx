"use client";

import { z } from "zod";
import { api, ApiClientError } from "../../services/api";
import { useZodForm } from "../../hooks/useZodForm";
import type { Schedule } from "../../types/api";
import { Button } from "../shared/ui/button";
import { FormBanner, FormField, FormGrid } from "../shared/ui/form";
import { Input } from "../shared/ui/input";
import { Modal } from "../shared/ui/modal";
import { Select } from "../shared/ui/select";

const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
const dayOptions = days.map((day) => ({ value: day as string, label: day.charAt(0) + day.slice(1).toLowerCase() }));
type DayOfWeek = (typeof days)[number];

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleFormSchema = z
  .object({
    courseCode: z.string().trim().min(2, "Required").max(24),
    courseTitle: z.string().trim().min(2, "Required").max(190),
    department: z.string().trim().min(2, "Required").max(80),
    roomNumber: z.string().trim().min(1, "Required").max(20),
    dayOfWeek: z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
    startTime: z.string().regex(timePattern, "Use HH:mm"),
    endTime: z.string().regex(timePattern, "Use HH:mm"),
    instructor: z.string().trim().min(2, "Required").max(120),
    section: z.string().trim().min(1, "Required").max(20),
    semester: z.string().trim().min(2, "Required").max(40)
  })
  .refine((value) => value.startTime < value.endTime, { message: "Must be after start time", path: ["endTime"] });

function toFormValues(schedule?: Schedule) {
  return {
    courseCode: schedule?.course.code ?? "",
    courseTitle: schedule?.course.title ?? "",
    department: schedule?.course.department ?? "CSE",
    roomNumber: schedule?.room.number ?? "",
    dayOfWeek: (schedule?.dayOfWeek ?? "SUNDAY") as DayOfWeek,
    startTime: schedule?.startTime.slice(11, 16) ?? "",
    endTime: schedule?.endTime.slice(11, 16) ?? "",
    instructor: schedule?.instructor ?? "",
    section: schedule?.section ?? "",
    semester: schedule?.semester ?? "Fall 2026"
  };
}

export function ScheduleForm({
  mode,
  schedule,
  onClose,
  onSaved
}: {
  mode: "create" | "edit";
  schedule?: Schedule;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useZodForm(scheduleFormSchema, toFormValues(schedule));

  async function onSubmit() {
    await form.handleSubmit(async (data) => {
      try {
        if (mode === "edit" && schedule) await api.updateSchedule(schedule.id, data);
        else await api.createSchedule(data);
        onSaved();
      } catch (error) {
        throw new Error(error instanceof ApiClientError ? error.message : "Could not save this class. Please try again.");
      }
    });
  }

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={mode === "edit" ? "Edit class" : "Add class"}
      description="Classes are checked against room bookings and events for conflicts."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={form.isSubmitting}>Cancel</Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Add class"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        {form.submitError && <FormBanner>{form.submitError}</FormBanner>}
        <FormGrid>
          <FormField label="Course code" htmlFor="sch-course-code" error={form.errors.courseCode}>
            <Input id="sch-course-code" value={form.values.courseCode} onChange={(e) => form.setValue("courseCode", e.target.value)} invalid={!!form.errors.courseCode} placeholder="CSE 4113" />
          </FormField>
          <FormField label="Course title" htmlFor="sch-course-title" error={form.errors.courseTitle}>
            <Input id="sch-course-title" value={form.values.courseTitle} onChange={(e) => form.setValue("courseTitle", e.target.value)} invalid={!!form.errors.courseTitle} placeholder="Pattern Recognition" />
          </FormField>
          <FormField label="Department" htmlFor="sch-department" error={form.errors.department}>
            <Input id="sch-department" value={form.values.department} onChange={(e) => form.setValue("department", e.target.value)} invalid={!!form.errors.department} />
          </FormField>
          <FormField label="Room number" htmlFor="sch-room" error={form.errors.roomNumber}>
            <Input id="sch-room" value={form.values.roomNumber} onChange={(e) => form.setValue("roomNumber", e.target.value)} invalid={!!form.errors.roomNumber} placeholder="7A07" />
          </FormField>
          <FormField label="Day" htmlFor="sch-day" error={form.errors.dayOfWeek}>
            <Select id="sch-day" options={dayOptions} value={form.values.dayOfWeek} onChange={(e) => form.setValue("dayOfWeek", e.target.value as typeof form.values.dayOfWeek)} invalid={!!form.errors.dayOfWeek} />
          </FormField>
          <FormField label="Section" htmlFor="sch-section" error={form.errors.section}>
            <Input id="sch-section" value={form.values.section} onChange={(e) => form.setValue("section", e.target.value)} invalid={!!form.errors.section} placeholder="B" />
          </FormField>
          <FormField label="Start time" htmlFor="sch-start" error={form.errors.startTime}>
            <Input id="sch-start" type="time" value={form.values.startTime} onChange={(e) => form.setValue("startTime", e.target.value)} invalid={!!form.errors.startTime} />
          </FormField>
          <FormField label="End time" htmlFor="sch-end" error={form.errors.endTime}>
            <Input id="sch-end" type="time" value={form.values.endTime} onChange={(e) => form.setValue("endTime", e.target.value)} invalid={!!form.errors.endTime} />
          </FormField>
          <FormField label="Instructor" htmlFor="sch-instructor" error={form.errors.instructor}>
            <Input id="sch-instructor" value={form.values.instructor} onChange={(e) => form.setValue("instructor", e.target.value)} invalid={!!form.errors.instructor} />
          </FormField>
          <FormField label="Semester" htmlFor="sch-semester" error={form.errors.semester}>
            <Input id="sch-semester" value={form.values.semester} onChange={(e) => form.setValue("semester", e.target.value)} invalid={!!form.errors.semester} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}
