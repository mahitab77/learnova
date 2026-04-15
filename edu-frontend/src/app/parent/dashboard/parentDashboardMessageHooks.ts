import { useCallback, useEffect, useMemo, useState } from "react";
import parentService, {
  type ParentNotificationsResponse,
} from "@/src/services/parentService";
import {
  mapAnnouncementRow,
  requireData,
  toHookError,
  type ParentAnnouncement,
  type ParentNotifications,
} from "./parentDashboardMappers";

export function useParentAnnouncements() {
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const normalized = requireData(await parentService.getParentAnnouncements());
    if (!normalized.ok) {
      setError(normalized.error);
      setLoading(false);
      return;
    }
    setAnnouncements(normalized.data.map(mapAnnouncementRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return useMemo(
    () => ({ announcements, loading, error, refresh: load }),
    [announcements, loading, error, load]
  );
}

export function useParentNotifications() {
  const [inbox, setInbox] = useState<ParentNotifications>({
    unreadCount: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const normalized = requireData(await parentService.getParentNotifications());
    if (!normalized.ok) {
      setError(normalized.error);
      setLoading(false);
      return;
    }
    const data = normalized.data as ParentNotificationsResponse;
    setInbox({
      unreadCount: Number.isFinite(data.unreadCount) ? data.unreadCount : 0,
      items: Array.isArray(data.items) ? data.items : [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const markRead = useCallback(
    async (id: number) => {
      setInbox((prev) => {
        const items = prev.items.map((item) =>
          item.id === id
            ? {
                ...item,
                isRead: true,
                readAt: item.readAt ?? new Date().toISOString(),
              }
            : item
        );
        const unreadCount = items.reduce(
          (count, item) => count + (item.isRead ? 0 : 1),
          0
        );
        return { unreadCount, items };
      });

      const result = await parentService.markNotificationRead(id);
      if (result.success) return { ok: true as const };

      await refresh();
      const mappedError = toHookError(result.message, result.code);
      setError(mappedError);
      return { ok: false as const, error: mappedError };
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    setInbox((prev) => ({
      unreadCount: 0,
      items: prev.items.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    }));

    const result = await parentService.markAllNotificationsRead();
    if (result.success) return { ok: true as const };

    await refresh();
    const mappedError = toHookError(result.message, result.code);
    setError(mappedError);
    return { ok: false as const, error: mappedError };
  }, [refresh]);

  return useMemo(
    () => ({ inbox, loading, error, refresh, markRead, markAllRead }),
    [inbox, loading, error, refresh, markRead, markAllRead]
  );
}
