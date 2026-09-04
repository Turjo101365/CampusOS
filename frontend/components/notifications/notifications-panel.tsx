"use client";

import { Bell, Building2, Calendar, CalendarClock, Check, ClipboardList, Megaphone, Sparkles } from "lucide-react";
import { useNotifications } from "../../features/notifications/useNotifications";
import { formatDateTime, titleCase } from "../../utils/format";
import { EmptyState, ErrorState, LoadingState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";

const sourceIcons: Record<string, typeof Bell> = {
  ANNOUNCEMENT: Megaphone,
  ASSIGNMENT: ClipboardList,
  EVENT: Calendar,
  ROOM_BOOKING: Building2,
  SCHEDULE: CalendarClock,
  SYSTEM: Sparkles
};

export function NotificationsPanel() {
  const { notifications, unreadCount, isLoading, error, refresh, markRead } = useNotifications(50);

  if (isLoading) return <LoadingState label="Loading notifications…" />;
  if (error) return <ErrorState title="Notifications are unavailable" message={error} onRetry={() => void refresh()} />;
  if (notifications.length === 0) return <EmptyState label="No notifications yet — proactive alerts will appear here." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
      </div>
      <div className="glass-surface divide-y divide-border/70 overflow-hidden rounded-xl">
        {notifications.map((notification) => {
          const Icon = sourceIcons[notification.sourceType] ?? Bell;
          const isUnread = notification.status !== "READ";
          return (
            <article key={notification.id} className={cnRow(isUnread)}>
              <span className={cnIcon(isUnread)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-muted text-muted-foreground">{titleCase(notification.sourceType)}</Badge>
                  {isUnread && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-foreground">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.sendAt)}</p>
              </div>
              {isUnread && (
                <Button type="button" variant="ghost" size="icon" aria-label="Mark as read" onClick={() => void markRead(notification.id)}>
                  <Check className="size-4" />
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function cnRow(isUnread: boolean): string {
  return `flex items-start gap-3.5 p-4 transition-standard sm:p-5 ${isUnread ? "bg-accent/40" : ""}`;
}

function cnIcon(isUnread: boolean): string {
  return `mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${isUnread ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`;
}
