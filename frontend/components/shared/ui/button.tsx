import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../../utils/cn";

const buttonVariants = cva(
  "inline-flex min-h-10 cursor-pointer select-none items-center justify-center gap-2 rounded-md text-sm font-medium tracking-tight transition-standard disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "gradient-primary px-4 text-primary-foreground shadow-soft hover:shadow-elevated hover:brightness-[1.04] active:brightness-95",
        outline: "border border-border bg-card/70 px-4 backdrop-blur-sm hover:border-primary/30 hover:bg-accent hover:text-accent-foreground",
        ghost: "px-3 hover:bg-muted",
        subtle: "bg-accent px-4 text-accent-foreground hover:bg-accent/70",
        destructive: "bg-destructive px-4 text-destructive-foreground shadow-soft hover:bg-destructive/90"
      },
      size: { default: "h-10 px-4", sm: "h-9 px-3 text-[13px]", icon: "h-10 w-10 p-0" }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return <Component className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
