import { ArrowRight, Megaphone } from "lucide-react";
import { useTodayIntelligence } from "../../hooks/useTodayIntelligence";
import type { DashboardData } from "../../types/api";
import { formatDateTime, titleCase } from "../../utils/format";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { AiPlanner } from "./ai-planner";
import type { DashboardView } from "./app-shell";
import { DashboardHero } from "./dashboard-hero";
import { ScheduleTimeline } from "./schedule-timeline";

export function CampusOverview({
  data,
  onViewChange,
  onRequestPlan
}: {
  data: DashboardData;
  onViewChange: (view: DashboardView) => void;
  onRequestPlan: (prompt: string) => void;
}) {
  const intelligence = useTodayIntelligence(data);

  return (
    <div className="space-y-6">
      <DashboardHero data={data} userName="Sakibul Hassan" />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="glass-surface rounded-xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight">Today&rsquo;s timeline</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => onViewChange("schedule")}>Full schedule<ArrowRight className="size-4" /></Button>
          </div>
          <ScheduleTimeline intelligence={intelligence} />
        </section>

        <AiPlanner intelligence={intelligence} onRequestPlan={onRequestPlan} />
      </div>

      <section className="glass-surface rounded-xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground"><Megaphone className="size-4" aria-hidden="true" /></span>
            Latest announcements
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => onViewChange("announcements")}>View all<ArrowRight className="size-4" /></Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {data.announcements.slice(0, 4).map((item) => (
            <article key={item.id} className="border-l-2 border-primary/60 pl-4">
              <div className="flex items-center gap-2">
                <Badge className={item.priority === "HIGH" || item.priority === "URGENT" ? "bg-rose-50 text-rose-700" : undefined}>{titleCase(item.priority)}</Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(item.publishedAt)}</span>
              </div>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
