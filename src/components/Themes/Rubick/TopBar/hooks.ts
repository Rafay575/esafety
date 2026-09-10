import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/axios";
import echo from "@/echo"; // ✅ import Echo instance

export interface NotificationItem {
  id: number;
  ptw_id: number;
  type: string;
  message: string;
  related_id: number;
  is_read: 0 | 1;
  created_at: string;
  label_en?: string;
  short_label_en?: string;
  label_ur?: string;
  short_label_ur?: string;
  ptw_code: string;
}

export interface NotificationsPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
}

export interface NotificationsResponse {
  message: string;
  data: NotificationItem[];
  pagination: NotificationsPagination;
}

async function fetchNotifications(page = 1, perPage = 10) {
  const res = await api.get<NotificationsResponse>(
    `/api/v1/notifications?page=${page}&per_page=${perPage}`
  );
  return res.data;
}

async function markNotificationRead(id: number) {
  const res = await api.patch<{ message: string }>(
    `/api/v1/notifications/${id}/read`
  );
  return res.data;
}

async function markAllNotificationsRead() {
  const res = await api.patch<{ message: string }>(
    `/api/v1/notifications/read-all`
  );
  return res.data;
}

export function useNotifications(perPage = 10) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<NotificationsPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage = 1, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNotifications(targetPage, perPage);
        setItems((prev) => (append ? [...prev, ...res.data] : res.data));
        setPagination(res.pagination);
        setPage(targetPage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load notifications"
        );
      } finally {
        setLoading(false);
      }
    },
    [perPage]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  // ✅ Subscribe to real-time notifications via Echo/Reverb
  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
    const userId = authUser?.id;
    if (!userId) return;

    // Channel name must match broadcastOn() in the event class
    const channel = echo.private(`user.${userId}`);

    // Listen for the event broadcastAs() returns "ptw.notification"
    channel.listen(".ptw.notification", (event: any) => {
      console.log("🔔 Realtime notification received:", event);

      // Map the payload to NotificationItem
      const newNotification: NotificationItem = {
        id: event.notification_id,
        ptw_id: event.ptw_id || 0,
        type: event.title || "PTW_NOTIFICATION",
        message: event.message || "",
        related_id: event.ptw_id || 0,
        is_read: 0,
        created_at: new Date().toISOString(),
        ptw_code: event.ptw_code || "",
        // Optional fields (can be undefined)
        label_en: event.title,
        short_label_en: event.title,
        label_ur: event.title,
        short_label_ur: event.title,
      };

      // Prepend to list, avoid duplicates
      setItems((prev) => {
        const exists = prev.some((n) => n.id === newNotification.id);
        return exists ? prev : [newNotification, ...prev];
      });

      // Optionally show a browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(newNotification.message || "New notification", {
          body: newNotification.short_label_en || newNotification.message,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      channel.stopListening(".ptw.notification");
    };
  }, []); // run once after mount

  const markOneRead = useCallback(async (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    try {
      await markNotificationRead(id);
    } catch (err) {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 0 } : n))
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      setItems(previous);
    }
  }, [items]);

  const loadMore = useCallback(() => {
    if (pagination?.has_more && !loading) {
      load(page + 1, true);
    }
  }, [pagination, loading, page, load]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  return {
    items,
    pagination,
    loading,
    error,
    unreadCount,
    markOneRead,
    markAllRead,
    loadMore,
    reload: () => load(1, false),
  };
}