"use client";

import { AlarmClock, CalendarRange, ClipboardList, Sparkles } from "lucide-react";
import type { DashboardData } from "../../types/api";
import { formatClock, useTodayIntelligence } from "../../hooks/useTodayIntelligence";
import { formatDateTime } from "../../utils/format";

const greetingFor = (hour: number): string => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export function DashboardHero({ data, userName }: { data: DashboardData; userName: string }) {
  const intelligence = useTodayIntelligence(data);
  const greeting = greetingFor(intelligence.now.getHours());
  const firstName = userName.split(" ")[0];

  const widgets = [
    {
      label: "Today's classes",
      icon: CalendarRange,
      value: intelligence.todayClasses.length,
      detail: intelligence.nextClass
        ? `Next: ${intelligence.nextClass.course.code} at ${formatClock(new Date(intelligence.nextClass.startTime).getUTCHours() * 60 + new Date(intelligence.nextClass.startTime).getUTCMinutes())}`
        : intelligence.todayClasses.length ? "All done for today" : "No classes today"
    },
    {
      label: "Upcoming deadline",
      icon: ClipboardList,
      value: intelligence.nextDeadline ? intelligence.nextDeadline.course.code : "—",
      detail: intelligence.nextDeadline ? `Due ${formatDateTime(intelligence.nextDeadline.dueAt)}` : "Nothing due soon"
    },
    {
      label: "Campus events",
      icon: Sparkles,
      value: intelligence.nextEvent ? intelligence.nextEvent.name : "—",
      detail: intelligence.nextEvent ? formatDateTime(intelligence.nextEvent.startsAt) : "Nothing scheduled",
      isTitle: true
    },
    {
      label: "AI insights",
      icon: AlarmClock,
      value: intelligence.freeSlots.length,
      detail: intelligence.freeSlots.length > 0 ? `Free slot at ${intelligence.freeSlots[0].label}` : "Your day is fully booked"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-surface relative overflow-hidden rounded-xl p-7 sm:p-9">
        <div className="gradient-primary absolute -right-24 -top-24 size-64 rounded-full opacity-[0.08] blur-3xl" aria-hidden="true" />
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" aria-hidden="true" /> AI-powered campus intelligence
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{greeting}, {firstName}.</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">Your campus intelligence summary is ready.</p>
      </div>

      <section aria-label="Campus summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget) => (
          <div key={widget.label} className="glass-surface flex flex-col gap-3 rounded-xl p-5 transition-standard hover:-translate-y-0.5 hover:shadow-elevated">
            <span className="gradient-primary flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-soft">
              <widget.icon className="size-5 shrink-0" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={widget.isTitle ? "truncate text-base font-semibold tracking-tight" : "text-2xl font-semibold tabular-nums tracking-tight"}>{widget.value}</p>
              <p className="mt-0.5 text-sm font-medium">{widget.label}</p>
              <p className="truncate text-xs text-muted-foreground">{widget.detail}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
