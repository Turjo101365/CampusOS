import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../utils/cn";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <FormLabel htmlFor={htmlFor}>{label}</FormLabel>
      {children}
      {error ? <FormError>{error}</FormError> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FormLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-medium tracking-tight text-foreground/90", className)} {...props} />;
}

export function FormError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p role="alert" className={cn("text-xs font-medium text-destructive", className)} {...props} />;
}

export function FormGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-5 sm:grid-cols-2", className)} {...props} />;
}

/** Banner for a submit-time error that isn't tied to one field (network/server failure). */
export function FormBanner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn("rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive", className)} {...props} />;
}
