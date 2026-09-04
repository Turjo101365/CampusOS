"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { TodayIntelligence } from "../../hooks/useTodayIntelligence";
import { Button } from "../shared/ui/button";

export function AiPlanner({ intelligence, onRequestPlan }: { intelligence: TodayIntelligence; onRequestPlan: (prompt: string) => void }) {
  const canPlan = intelligence.freeSlots.length > 0;

  function requestPlan() {
    const slot = intelligence.freeSlots[0];
    const deadlinePart = intelligence.nextDeadline ? ` I want to make progress on "${intelligence.nextDeadline.title}" (${intelligence.nextDeadline.course.code}).` : "";
    onRequestPlan(`Suggest a focused study plan for my free time from ${slot.label} today.${deadlinePart}`);
  }

  return (
    <section className="glass-surface flex h-full flex-col rounded-xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="gradient-primary flex size-8 items-center justify-center rounded-lg text-primary-foreground shadow-soft">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <h2 className="font-semibold tracking-tight">AI Planner</h2>
      </div>

      <div className="mt-5 space-y-3 border-l-2 border-primary/50 pl-4">
        {intelligence.insightLines.map((line, index) => (
          <p key={index} className="text-[15px] leading-7 text-foreground">{line}</p>
        ))}
      </div>

      {canPlan && (
        <Button type="button" className="mt-6 w-full" onClick={requestPlan}>
          Generate a study plan <ArrowRight className="size-4" />
        </Button>
      )}

      <div className="mt-auto pt-6">
        <p className="text-xs text-muted-foreground">Powered by live schedules, deadlines, and events — not a static suggestion.</p>
      </div>
    </section>
  );
}
