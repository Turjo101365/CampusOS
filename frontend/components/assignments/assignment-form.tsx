"use client";

import { z } from "zod";
import { api, ApiClientError } from "../../services/api";
import { useZodForm } from "../../hooks/useZodForm";
import type { Assignment } from "../../types/api";
import { isoToLocalInput, localInputToIso } from "../../utils/format";
import { Button } from "../shared/ui/button";
import { FormBanner, FormField, FormGrid } from "../shared/ui/form";
import { Input, Textarea } from "../shared/ui/input";
import { Modal } from "../shared/ui/modal";

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, `${label} must be between ${min} and ${max}`);

const assignmentFormSchema = z
  .object({
    courseCode: z.string().trim().min(2, "Required").max(24),
    courseTitle: z.string().trim().min(2, "Required").max(190),
    department: z.string().trim().min(2, "Required").max(80),
    title: z.string().trim().min(3, "Required").max(190),
    description: z.string().trim().max(5000),
    assignedAtLocal: z.string().min(1, "Required"),
    dueAtLocal: z.string().min(1, "Required"),
    submissionPlatform: z.string().trim().min(2, "Required").max(120),
    marks: wholeNumber("Marks", 0, 1000)
  })
  .refine((value) => value.assignedAtLocal < value.dueAtLocal, { message: "Must be after assigned date", path: ["dueAtLocal"] })
  .transform(({ assignedAtLocal, dueAtLocal, description, ...rest }) => ({
    ...rest,
    description: description.trim() ? description.trim() : null,
    assignedAt: localInputToIso(assignedAtLocal),
    dueAt: localInputToIso(dueAtLocal)
  }));

function toFormValues(assignment?: Assignment) {
  return {
    courseCode: assignment?.course.code ?? "",
    courseTitle: assignment?.course.title ?? "",
    department: assignment?.course.department ?? "CSE",
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    assignedAtLocal: isoToLocalInput(assignment?.assignedAt),
    dueAtLocal: isoToLocalInput(assignment?.dueAt),
    submissionPlatform: assignment?.submissionPlatform ?? "",
    marks: String(assignment?.marks ?? "")
  };
}

export function AssignmentForm({
  mode,
  assignment,
  onClose,
  onSaved
}: {
  mode: "create" | "edit";
  assignment?: Assignment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useZodForm(assignmentFormSchema, toFormValues(assignment));

  async function onSubmit() {
    await form.handleSubmit(async (data) => {
      try {
        if (mode === "edit" && assignment) await api.updateAssignment(assignment.id, data);
        else await api.createAssignment(data);
        onSaved();
      } catch (error) {
        throw new Error(error instanceof ApiClientError ? error.message : "Could not save this assignment. Please try again.");
      }
    });
  }

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={mode === "edit" ? "Edit assignment" : "Add assignment"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={form.isSubmitting}>Cancel</Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Add assignment"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
        {form.submitError && <FormBanner>{form.submitError}</FormBanner>}
        <FormField label="Title" htmlFor="asg-title" error={form.errors.title}>
          <Input id="asg-title" value={form.values.title} onChange={(e) => form.setValue("title", e.target.value)} invalid={!!form.errors.title} placeholder="Assignment 1: Bayes Classifier" />
        </FormField>
        <FormField label="Description" htmlFor="asg-description" error={form.errors.description} hint="Optional">
          <Textarea id="asg-description" value={form.values.description} onChange={(e) => form.setValue("description", e.target.value)} invalid={!!form.errors.description} />
        </FormField>
        <FormGrid>
          <FormField label="Course code" htmlFor="asg-course-code" error={form.errors.courseCode}>
            <Input id="asg-course-code" value={form.values.courseCode} onChange={(e) => form.setValue("courseCode", e.target.value)} invalid={!!form.errors.courseCode} placeholder="CSE 4113" />
          </FormField>
          <FormField label="Course title" htmlFor="asg-course-title" error={form.errors.courseTitle}>
            <Input id="asg-course-title" value={form.values.courseTitle} onChange={(e) => form.setValue("courseTitle", e.target.value)} invalid={!!form.errors.courseTitle} />
          </FormField>
          <FormField label="Department" htmlFor="asg-department" error={form.errors.department}>
            <Input id="asg-department" value={form.values.department} onChange={(e) => form.setValue("department", e.target.value)} invalid={!!form.errors.department} />
          </FormField>
          <FormField label="Submission platform" htmlFor="asg-platform" error={form.errors.submissionPlatform}>
            <Input id="asg-platform" value={form.values.submissionPlatform} onChange={(e) => form.setValue("submissionPlatform", e.target.value)} invalid={!!form.errors.submissionPlatform} placeholder="Google Classroom" />
          </FormField>
          <FormField label="Assigned at" htmlFor="asg-assigned" error={form.errors.assignedAtLocal}>
            <Input id="asg-assigned" type="datetime-local" value={form.values.assignedAtLocal} onChange={(e) => form.setValue("assignedAtLocal", e.target.value)} invalid={!!form.errors.assignedAtLocal} />
          </FormField>
          <FormField label="Due at" htmlFor="asg-due" error={form.errors.dueAtLocal}>
            <Input id="asg-due" type="datetime-local" value={form.values.dueAtLocal} onChange={(e) => form.setValue("dueAtLocal", e.target.value)} invalid={!!form.errors.dueAtLocal} />
          </FormField>
          <FormField label="Marks" htmlFor="asg-marks" error={form.errors.marks}>
            <Input id="asg-marks" type="number" min={0} value={form.values.marks} onChange={(e) => form.setValue("marks", e.target.value)} invalid={!!form.errors.marks} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}
