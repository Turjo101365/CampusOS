"use client";

import { Bell, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../features/notifications/useNotifications";
import { formatDateTime, titleCase } from "../../utils/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function NotificationCenter({ onViewAll }: { onViewAll?: () => void } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markRead } = useNotifications();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="relative" ref={container}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`${unreadCount} unread notifications`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="gradient-primary absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-primary-foreground shadow-soft">
            {Math.min(unreadCount, 9)}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="glass-surface animate-fade-in-up absolute right-0 z-40 mt-2 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
            </div>
            {onViewAll && (
              <button
                type="button"
                className="text-xs font-medium text-primary transition-standard hover:underline"
                onClick={() => { setIsOpen(false); onViewAll(); }}
              >
                View all
              </button>
            )}
          </div>
          <div className="scrollbar-thin max-h-80 divide-y divide-border/70 overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading notifications…</p>}
            {!isLoading && notifications.length === 0 && <p className="p-4 text-sm text-muted-foreground">You&rsquo;re all caught up.</p>}
            {notifications.slice(0, 6).map((notification) => (
              <article key={notification.id} className="p-4 transition-standard hover:bg-accent/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge className="bg-muted text-muted-foreground">{titleCase(notification.sourceType)}</Badge>
                    <p className="mt-2 text-sm leading-6">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.sendAt)}</p>
                  </div>
                  {notification.status !== "READ" && (
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-standard hover:bg-muted hover:text-foreground"
                      aria-label="Mark notification read"
                      onClick={() => void markRead(notification.id)}
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
