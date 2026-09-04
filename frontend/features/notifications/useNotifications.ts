"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../../services/api";
import type { Notification } from "../../types/api";

export function useNotifications(limit = 10) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setNotifications(await api.getNotifications({ limit }));
    } catch (caught) {
      setNotifications([]);
      setError(caught instanceof ApiClientError ? caught.message : "Notifications could not be loaded");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function markRead(id: string): Promise<void> {
    const updated = await api.markNotificationRead(id);
    setNotifications((current) => current.map((item) => item.id === id ? updated : item));
  }

  return {
    notifications,
    unreadCount: notifications.filter((item) => item.status !== "READ").length,
    isLoading,
    error,
    refresh,
    markRead
  };
}
