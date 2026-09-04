"use client";

import { CalendarClock, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { TodayIntelligence } from "../../hooks/useTodayIntelligence";
import { formatClock } from "../../hooks/useTodayIntelligence";
import { EmptyState } from "../shared/data-state";
import { Badge } from "../shared/ui/badge";

interface TimelineEntry {
  kind: "class" | "free";
  startMinutes: number;
  label: string;
  content: ReactNode;
}

export function ScheduleTimeline({ intelligence }: { intelligence: TodayIntelligence }) {
  if (intelligence.todayClasses.length === 0 && intelligence.freeSlots.length === 0) {
    return <EmptyState label="Nothing scheduled for today." />;
  }

  const classEntries: TimelineEntry[] = intelligence.todayClasses.map((item) => {
    const start = new Date(item.startTime).getUTCHours() * 60 + new Date(item.startTime).getUTCMinutes();
    const end = new Date(item.endTime).getUTCHours() * 60 + new Date(item.endTime).getUTCMinutes();
    return {
      kind: "class",
      startMinutes: start,
      label: `${formatClock(start)}–${formatClock(end)}`,
      content: (
        <div className="glass-surface flex-1 rounded-lg p-4 transition-standard hover:shadow-elevated">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{item.course.code}</p>
              <p className="text-sm text-muted-foreground">{item.course.title}</p>
            </div>
            <Badge><MapPin className="mr-1 size-3" />{item.room.number}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{item.instructor} · Section {item.section}</p>
        </div>
      )
    };
  });

  const freeEntries: TimelineEntry[] = intelligence.freeSlots.map((slot) => ({
    kind: "free",
    startMinutes: slot.startMinutes,
    label: slot.label,
    content: (
      <div className="flex-1 rounded-lg border border-dashed border-primary/25 bg-accent/30 p-4 text-accent-foreground">
        <p className="flex items-center gap-1.5 text-sm font-medium"><CalendarClock className="size-3.5" /> Free slot</p>
        <p className="mt-1 text-xs text-muted-foreground">Good time for focused work or a study session.</p>
      </div>
    )
  }));

  const entries = [...classEntries, ...freeEntries].sort((a, b) => a.startMinutes - b.startMinutes);

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li key={`${entry.kind}-${entry.startMinutes}-${index}`} className="flex gap-4">
          <div className="flex w-20 shrink-0 flex-col items-end pt-4 text-right">
            <span className="text-xs font-medium tabular-nums text-muted-foreground">{entry.label.split("–")[0]}</span>
          </div>
          <div className="relative flex shrink-0 flex-col items-center pt-4">
            <span className={entry.kind === "class" ? "gradient-primary size-2.5 rounded-full" : "size-2.5 rounded-full border-2 border-primary/30 bg-background"} />
            {index < entries.length - 1 && <span className="mt-1 w-px flex-1 bg-border/70" />}
          </div>
          {entry.content}
        </li>
      ))}
    </ol>
  );
}
