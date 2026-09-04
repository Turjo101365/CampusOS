"use client";

import { Building2, CalendarDays, CalendarRange, ClipboardList, Megaphone, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData } from "../../types/api";
import type { DashboardView } from "./app-shell";

interface SearchHit {
  id: string;
  icon: typeof Search;
  title: string;
  subtitle: string;
  view: DashboardView;
}

export function GlobalSearch({ data, onNavigate }: { data: DashboardData; onNavigate: (view: DashboardView) => void }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const hits = useMemo<SearchHit[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const results: SearchHit[] = [];

    for (const item of data.schedules) {
      if (`${item.course.code} ${item.course.title}`.toLowerCase().includes(needle)) {
        results.push({ id: `sch-${item.id}`, icon: CalendarDays, title: `${item.course.code} · ${item.course.title}`, subtitle: `Schedule · Room ${item.room.number}`, view: "schedule" });
      }
    }
    for (const item of data.rooms) {
      if (item.number.toLowerCase().includes(needle)) {
        results.push({ id: `room-${item.id}`, icon: Building2, title: `Room ${item.number}`, subtitle: "Rooms & facilities", view: "rooms" });
      }
    }
    for (const item of data.events) {
      if (item.name.toLowerCase().includes(needle)) {
        results.push({ id: `evt-${item.id}`, icon: CalendarRange, title: item.name, subtitle: "Campus events", view: "events" });
      }
    }
    for (const item of data.assignments) {
      if (`${item.title} ${item.course.code}`.toLowerCase().includes(needle)) {
        results.push({ id: `asg-${item.id}`, icon: ClipboardList, title: item.title, subtitle: `Assignment · ${item.course.code}`, view: "assignments" });
      }
    }
    for (const item of data.announcements) {
      if (item.title.toLowerCase().includes(needle)) {
        results.push({ id: `ann-${item.id}`, icon: Megaphone, title: item.title, subtitle: "Announcements", view: "announcements" });
      }
    }
    return results.slice(0, 8);
  }, [data, query]);

  return (
    <div className="relative hidden sm:block" ref={container}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search classes, rooms, events…"
        className="h-10 w-56 rounded-md border border-input bg-card/60 pl-9 pr-8 text-sm transition-standard placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:w-72"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setQuery(""); setIsOpen(false); }}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-standard hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}

      {isOpen && query && (
        <div className="glass-surface animate-fade-in-up absolute left-0 right-0 z-40 mt-2 max-h-80 overflow-y-auto rounded-xl">
          {hits.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No matches for &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => { onNavigate(hit.view); setIsOpen(false); setQuery(""); }}
                    className="flex w-full items-center gap-3 p-3 text-left transition-standard hover:bg-accent/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><hit.icon className="size-4" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{hit.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
