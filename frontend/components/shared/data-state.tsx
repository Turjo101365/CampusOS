import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";

export function LoadingState({ label = "Loading campus data…" }: { label?: string } = {}) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-2.5 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-5 animate-spin text-primary" /> {label}
    </div>
  );
}

export function ErrorState({ title = "Campus data is unavailable", message, onRetry }: { title?: string; message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center" role="alert">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10"><AlertCircle className="size-6 text-destructive" /></span>
      <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{message}</p></div>
      <Button type="button" variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 text-sm text-muted-foreground">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent"><Inbox className="size-5 text-accent-foreground" /></span>
      <p>{label}</p>
    </div>
  );
}
