import { useMemo } from "react";
import type { Assignment, CampusEvent, DashboardData, Schedule } from "../types/api";

const DAY_KEYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const CAMPUS_DAY_START_MINUTES = 8 * 60;
const CAMPUS_DAY_END_MINUTES = 18 * 60;
const MIN_FREE_SLOT_MINUTES = 60;

export interface FreeSlot {
  startMinutes: number;
  endMinutes: number;
  label: string;
}

export interface TodayIntelligence {
  now: Date;
  todayClasses: Schedule[];
  nextClass: Schedule | null;
  freeSlots: FreeSlot[];
  nextDeadline: Assignment | null;
  nextEvent: CampusEvent | null;
  insightLines: string[];
}

function minutesOf(isoTime: string): number {
  const date = new Date(isoTime);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function formatClock(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return minutes === 0 ? `${hours12} ${period}` : `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function useTodayIntelligence(data: DashboardData): TodayIntelligence {
  return useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const todayKey = DAY_KEYS[now.getDay()];

    const todayClasses = data.schedules
      .filter((item) => item.dayOfWeek === todayKey)
      .sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));

    const nextClass = todayClasses.find((item) => minutesOf(item.startTime) >= nowMinutes) ?? null;

    const freeSlots: FreeSlot[] = [];
    const blocks = todayClasses.map((item) => [minutesOf(item.startTime), minutesOf(item.endTime)] as const);
    let cursor = Math.max(CAMPUS_DAY_START_MINUTES, nowMinutes);
    for (const [start, end] of blocks) {
      if (start > cursor && start - cursor >= MIN_FREE_SLOT_MINUTES) {
        freeSlots.push({ startMinutes: cursor, endMinutes: start, label: `${formatClock(cursor)}–${formatClock(start)}` });
      }
      cursor = Math.max(cursor, end);
    }
    if (CAMPUS_DAY_END_MINUTES - cursor >= MIN_FREE_SLOT_MINUTES) {
      freeSlots.push({ startMinutes: cursor, endMinutes: CAMPUS_DAY_END_MINUTES, label: `${formatClock(cursor)}–${formatClock(CAMPUS_DAY_END_MINUTES)}` });
    }

    const nextDeadline = data.assignments
      .filter((item) => {
        const status = item.submissions?.[0]?.status ?? "PENDING";
        return status !== "SUBMITTED" && status !== "GRADED" && new Date(item.dueAt).getTime() >= now.getTime();
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0] ?? null;

    const nextEvent = data.events
      .filter((item) => (item.status === "UPCOMING" || item.status === "ACTIVE") && new Date(item.startsAt).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null;

    const insightLines: string[] = [];
    if (nextClass) {
      insightLines.push(`You have ${nextClass.course.code} at ${formatClock(minutesOf(nextClass.startTime))} in Room ${nextClass.room.number}.`);
    } else if (todayClasses.length === 0) {
      insightLines.push("You have no classes scheduled today.");
    } else {
      insightLines.push("You've finished all of today's classes.");
    }
    if (nextDeadline) {
      const dueDate = new Date(nextDeadline.dueAt);
      const isToday = dueDate.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
      const when = isToday ? "today" : isTomorrow ? "tomorrow" : `on ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      insightLines.push(`Your ${nextDeadline.course.code} assignment "${nextDeadline.title}" is due ${when}.`);
    }
    if (freeSlots.length > 0) {
      insightLines.push(`You have a free slot from ${freeSlots[0].label}.`);
    }
    if (freeSlots.length > 0 && nextDeadline) {
      insightLines.push("Would you like a study plan?");
    }

    return { now, todayClasses, nextClass, freeSlots, nextDeadline, nextEvent, insightLines };
  }, [data]);
}

export { formatClock };
