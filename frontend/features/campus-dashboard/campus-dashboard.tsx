"use client";

import { useState } from "react";
import { AiAssistant } from "../../components/ai-chat/ai-assistant";
import { AnnouncementsList } from "../../components/dashboard/announcements-list";
import { AppShell, type DashboardView } from "../../components/dashboard/app-shell";
import { AssignmentsList } from "../../components/dashboard/assignments-list";
import { CampusOverview } from "../../components/dashboard/campus-overview";
import { EventsList } from "../../components/dashboard/events-list";
import { PageHeader } from "../../components/dashboard/page-header";
import { NotificationsPanel } from "../../components/notifications/notifications-panel";
import { RoomsGrid } from "../../components/rooms/rooms-grid";
import { ErrorState, LoadingState } from "../../components/shared/data-state";
import { ScheduleList } from "../../components/schedule/schedule-list";
import { useCampusData } from "../../hooks/useCampusData";

const viewCopy: Record<DashboardView, [string, string]> = {
  overview: ["Campus overview", "A live snapshot of classes, spaces, deadlines, and notices."],
  schedule: ["Class schedule", "Your enrolled courses for Fall 2026."],
  rooms: ["Rooms & facilities", "Capacity, equipment, and current operating status."],
  events: ["Campus events", "Upcoming talks, workshops, and community activities."],
  assignments: ["Assignments", "Deadlines and submission status across your courses."],
  announcements: ["Announcements", "Active notices from departments and campus services."],
  notifications: ["Notifications", "Proactive alerts CampusOS generated on your behalf."],
  assistant: ["AI assistant", "Ask a question; CampusOS will select the right live service tools."]
};

export function CampusDashboard() {
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const { data, isLoading, error, refresh } = useCampusData();
  const [title, description] = viewCopy[activeView];

  function requestStudyPlan(prompt: string): void {
    setPendingPrompt(prompt);
    setActiveView("assistant");
  }

  let content = null;
  if (activeView === "assistant") {
    content = (
      <AiAssistant
        onMutated={() => void refresh()}
        initialPrompt={pendingPrompt}
        onInitialPromptConsumed={() => setPendingPrompt(undefined)}
      />
    );
  } else if (activeView === "notifications") content = <NotificationsPanel />;
  else if (isLoading) content = <LoadingState />;
  else if (error) content = <ErrorState message={error} onRetry={() => void refresh()} />;
  else if (activeView === "overview") content = <CampusOverview data={data} onViewChange={setActiveView} onRequestPlan={requestStudyPlan} />;
  else if (activeView === "schedule") content = <section className="glass-surface rounded-xl p-6"><ScheduleList schedules={data.schedules} onMutated={() => void refresh()} /></section>;
  else if (activeView === "rooms") content = <RoomsGrid rooms={data.rooms} onMutated={() => void refresh()} />;
  else if (activeView === "events") content = <EventsList events={data.events} onMutated={() => void refresh()} />;
  else if (activeView === "assignments") content = <AssignmentsList assignments={data.assignments} onMutated={() => void refresh()} />;
  else content = <AnnouncementsList announcements={data.announcements} onMutated={() => void refresh()} />;

  return (
    <AppShell activeView={activeView} onViewChange={setActiveView}>
      <PageHeader
        title={title}
        description={description}
        onRefresh={() => void refresh()}
        isRefreshing={isLoading}
        onViewAllNotifications={() => setActiveView("notifications")}
        searchData={data}
        onNavigate={setActiveView}
      />
      <div key={activeView} className="animate-fade-in-up p-6 sm:p-8 lg:p-10">{content}</div>
    </AppShell>
  );
}
