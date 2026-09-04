"use client";

import { Button } from "./button";
import { FormBanner } from "./form";
import { Modal } from "./modal";

/**
 * Specialized Modal for destructive confirmations (delete actions).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  error,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  error?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting…" : confirmLabel}
          </Button>
        </>
      }
    >
      {error && <FormBanner>{error}</FormBanner>}
    </Modal>
  );
}
