"use client";

import { CalendarCheck2, Monitor, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { Room } from "../../types/api";
import { titleCase } from "../../utils/format";
import { EmptyState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { ConfirmDialog } from "../shared/ui/confirm-dialog";
import { RoomForm } from "./room-form";
import { RoomBookingModal } from "./room-booking-modal";

type FormState = { mode: "create" } | { mode: "edit"; room: Room };

export function RoomsGrid({ rooms, onMutated }: { rooms: Room[]; onMutated: () => void }) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteRoom(pendingDelete.id);
      setPendingDelete(null);
      onMutated();
    } catch (error) {
      setDeleteError(error instanceof ApiClientError ? error.message : "Could not delete this room.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="size-4" /> Add room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState label="No rooms match this view" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="glass-surface rounded-xl p-5 transition-standard hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{room.number}</h3>
                  <p className="text-sm text-muted-foreground">Floor {room.floor} · {titleCase(room.type)}</p>
                </div>
                <Badge className={room.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{titleCase(room.status)}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5"><Users className="size-4 text-muted-foreground" />{room.capacity} seats</span>
                <span className="flex items-center gap-1.5"><Monitor className="size-4 text-muted-foreground" />{room.features.length} features</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {room.features.slice(0, 4).map((feature) => <Badge key={feature.id}>{titleCase(feature.name)}</Badge>)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                {room.status === "AVAILABLE" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setBookingRoom(room)}
                  >
                    <CalendarCheck2 className="size-3.5" /> Book
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Unavailable</span>
                )}
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormState({ mode: "edit", room })}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-red-50" onClick={() => setPendingDelete(room)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {bookingRoom && (
        <RoomBookingModal
          room={bookingRoom}
          onClose={() => setBookingRoom(null)}
          onBooked={() => {
            setBookingRoom(null);
            onMutated();
          }}
        />
      )}

      {formState && (
        <RoomForm
          mode={formState.mode}
          room={formState.mode === "edit" ? formState.room : undefined}
          onClose={() => setFormState(null)}
          onSaved={() => { setFormState(null); onMutated(); }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDeleteError(null); } }}
        title={`Delete room ${pendingDelete?.number ?? ""}?`}
        description="This permanently removes the room and its bookings. This cannot be undone."
        error={deleteError}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
