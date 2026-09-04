import { RefreshCw } from "lucide-react";
import type { DashboardData } from "../../types/api";
import { Button } from "../shared/ui/button";
import { NotificationCenter } from "../shared/notification-center";
import type { DashboardView } from "./app-shell";
import { GlobalSearch } from "./global-search";

export function PageHeader({
  title,
  description,
  onRefresh,
  isRefreshing,
  onViewAllNotifications,
  searchData,
  onNavigate
}: {
  title: string;
  description: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewAllNotifications?: () => void;
  searchData: DashboardData;
  onNavigate: (view: DashboardView) => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-border/70 bg-background/80 px-6 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between lg:px-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <GlobalSearch data={searchData} onNavigate={onNavigate} />
        <NotificationCenter onViewAll={onViewAllNotifications} />
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} /> Refresh
        </Button>
      </div>
    </header>
  );
}
