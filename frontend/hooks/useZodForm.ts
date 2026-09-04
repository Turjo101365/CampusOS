"use client";

import { useState } from "react";
import type { z } from "zod";

/**
 * Minimal client-side form state + Zod validation, shared by every
 * add/edit form in the app. Field errors surface inline via FormField;
 * submit-time (network/server) errors surface via submitError.
 */
export function useZodForm<Schema extends z.ZodType>(schema: Schema, initialValues: z.input<Schema>) {
  const [values, setValues] = useState<z.input<Schema>>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setValue<K extends keyof z.input<Schema>>(key: K, value: z.input<Schema>[K]): void {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function reset(next: z.input<Schema> = initialValues): void {
    setValues(next);
    setErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(onValid: (data: z.output<Schema>) => Promise<void> | void): Promise<void> {
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onValid(result.data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, errors, isSubmitting, submitError, setValue, handleSubmit, reset };
}
