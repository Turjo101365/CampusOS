"use client";

import { Bell, Bot, Building2, CalendarDays, CalendarRange, ClipboardList, LayoutDashboard, Megaphone, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useNotifications } from "../../features/notifications/useNotifications";
import { cn } from "../../utils/cn";

export type DashboardView = "overview" | "schedule" | "rooms" | "events" | "assignments" | "announcements" | "notifications" | "assistant";

const navigation = [
  ["overview", "Overview", LayoutDashboard],
  ["schedule", "Schedule", CalendarDays],
  ["rooms", "Rooms", Building2],
  ["events", "Events", CalendarRange],
  ["assignments", "Assignments", ClipboardList],
  ["announcements", "Announcements", Megaphone],
  ["notifications", "Notifications", Bell],
  ["assistant", "AI assistant", Bot]
] as const;

export function AppShell({ activeView, onViewChange, children }: { activeView: DashboardView; onViewChange: (view: DashboardView) => void; children: ReactNode }) {
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="border-b border-border/70 bg-card/70 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 px-6 lg:h-20">
          <span className="gradient-primary flex size-9 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground shadow-soft">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="font-semibold tracking-tight">CampusOS</p>
            <p className="text-xs text-muted-foreground">AUST · Fall 2026</p>
          </div>
        </div>
        <nav aria-label="Dashboard navigation" className="scrollbar-thin flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {navigation.map(([id, label, Icon]) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-standard lg:w-full",
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
                {id === "notifications" && unreadCount > 0 && (
                  <span
                    className={cn(
                      "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                      isActive ? "bg-white/25 text-primary-foreground" : "bg-primary/10 text-primary"
                    )}
                  >
                    {Math.min(unreadCount, 99)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mx-4 mb-4 mt-auto hidden items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3 lg:flex">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">SH</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Sakibul Hassan</p>
            <p className="text-xs text-muted-foreground">20-40532</p>
          </div>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
