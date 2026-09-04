import * as React from "react";
import { cn } from "../../../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, invalid, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "min-h-10 w-full cursor-pointer rounded-md border border-input bg-card/60 px-3.5 text-sm text-foreground transition-standard focus-visible:border-primary/40 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        invalid && "border-destructive/60 focus-visible:ring-destructive/30",
        className
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
);
Select.displayName = "Select";
