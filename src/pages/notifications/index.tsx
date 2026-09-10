"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns"; // optional, for time ago
import { useNotifications } from "@/components/Themes/Rubick/TopBar/hooks"; // adjust import path

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    items,
    pagination,
    loading,
    error,
    unreadCount,
    markOneRead,
    markAllRead,
    loadMore,
    reload,
  } = useNotifications(10);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      try {
        await markOneRead(notif.id);
      } catch (e) {
        toast.error("Failed to mark as read");
      }
    }
    if (notif.ptw_id) {
      navigate(`/ptw/${notif.ptw_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-rose-500 text-white text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with your PTW activities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline-secondary"
            onClick={reload}
            disabled={loading}
          >
            <Lucide icon="RefreshCw" className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="primary" onClick={handleMarkAllRead}>
              <Lucide icon="CheckCheck" className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-600 text-sm">
          {error}
          <button
            onClick={reload}
            className="ml-2 underline font-medium hover:text-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state (initial) */}
      {loading && items.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-slate-400" size={32} />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Lucide icon="Bell" className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No notifications yet</p>
          <p className="text-sm text-slate-400 mt-1">
            You'll see updates about your PTWs here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {items.map((notif) => {
            const isUnread = !notif.is_read;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                  isUnread ? "bg-indigo-50/40 hover:bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                {/* Icon based on type (you can customize) */}
                <div
                  className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isUnread
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Lucide
                    icon={
                      notif.type?.toLowerCase().includes("approve")
                        ? "CheckCircle"
                        : notif.type?.toLowerCase().includes("reject")
                        ? "XCircle"
                        : "Bell"
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        isUnread ? "font-semibold text-slate-900" : "text-slate-600"
                      }`}
                    >
                      {notif.message || notif.label_en || "New notification"}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    {notif.ptw_code && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono">
                        {notif.ptw_code}
                      </span>
                    )}
                    <span>
                      {notif.created_at
                        ? formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {pagination?.has_more && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline-secondary"
            onClick={loadMore}
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" size={16} />
                Loading...
              </>
            ) : (
              <>
                <Lucide icon="ChevronDown" className="w-4 h-4 mr-2" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}

      {/* Footer pagination info */}
      {pagination && (
        <div className="text-center text-xs text-slate-400">
          Showing {items.length} of {pagination.total} notifications
        </div>
      )}
    </div>
  );
}