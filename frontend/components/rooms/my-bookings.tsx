"use client";

import { CalendarClock, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { RoomBookingSummary } from "../../types/api";
import { formatDateTime } from "../../utils/format";
import { Button } from "../shared/ui/button";
import { ConfirmDialog } from "../shared/ui/confirm-dialog";

export function MyRoomBookings({ refreshKey }: { refreshKey: number }) {
  const [bookings, setBookings] = useState<RoomBookingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState<RoomBookingSummary | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setBookings(await api.getMyRoomBookings());
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh, refreshKey]);

  async function handleCancel(): Promise<void> {
    if (!pendingCancel) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await api.cancelRoomBooking(pendingCancel.room.id, pendingCancel.id);
      setPendingCancel(null);
      void refresh();
    } catch (error) {
      setCancelError(error instanceof ApiClientError ? error.message : "Could not cancel this booking.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (!isLoading && bookings.length === 0) return null;

  return (
    <div className="glass-surface rounded-xl p-5">
      <h3 className="flex items-center gap-2 font-semibold tracking-tight">
        <CalendarClock className="size-4 text-primary" aria-hidden="true" /> Your bookings
      </h3>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" /> Room {booking.room.number}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(booking.startsAt)} – {formatDateTime(booking.endsAt)} · {booking.purpose}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => setPendingCancel(booking)}>
                <X className="size-3.5" /> Cancel
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={pendingCancel !== null}
        onOpenChange={(open) => { if (!open) { setPendingCancel(null); setCancelError(null); } }}
        title={`Cancel booking for Room ${pendingCancel?.room.number ?? ""}?`}
        description="This permanently cancels your reservation. This cannot be undone."
        error={cancelError}
        isLoading={isCancelling}
        onConfirm={() => void handleCancel()}
      />
    </div>
  );
}
