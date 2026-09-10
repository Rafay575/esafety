import { useState, Fragment } from "react";
import Lucide from "@/components/Base/Lucide";
import Breadcrumb from "@/components/Base/Breadcrumb";
import { Menu, Popover } from "@/components/Base/Headless";
import _ from "lodash";
import { useDispatch } from "react-redux";
import { logout } from "@/stores/authSlice";
import { useNavigate } from "react-router-dom";
import { User, Bell } from "lucide-react";
import { useNotifications } from "./hooks";
import { api } from "@/lib/axios";
import { toast } from "sonner";

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
 
  if (diffSec < 60) return "just now";
 
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
 
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
 
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
 
  return date.toLocaleDateString();
}
 
function Main() {
  const [searchDropdown, setSearchDropdown] = useState(false);
  const showSearchDropdown = () => {
    setSearchDropdown(true);
  };
  const hideSearchDropdown = () => {
    setSearchDropdown(false);
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlelogout = async () => {
    try {
      const response = await api.post("/api/v1/auth/logout");
      if (response.data?.success) {
        dispatch(logout());
        navigate("/login");
      } else {
        toast.error("Logout failed. Please try again.");
      }
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  // Dropdown only needs a handful of recent items — full list lives on /notifications
  const {
    items: notifications,
    unreadCount,
    loading: notificationsLoading,
    markOneRead,
    markAllRead,
  } = useNotifications(5);

  const handleNotificationClick = (id: number, isRead: 0 | 1) => {
    if (!isRead) markOneRead(id);
  };

  return (
    <>
      {/* BEGIN: Top Bar */}
      <div className="h-[67px] z-[51] flex items-center relative border-b border-slate-200">
        {/* BEGIN: Breadcrumb */}
        <Breadcrumb className="hidden mr-auto -intro-x sm:flex">
          <Breadcrumb.Link to="/">E-safety</Breadcrumb.Link>
          <Breadcrumb.Link to="/" active={true}>
            Dashboard
          </Breadcrumb.Link>
        </Breadcrumb>
        {/* END: Breadcrumb */}

        {/* BEGIN: Notifications */}
        <Popover className="mr-4 intro-x">
          <Popover.Button className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-white zoom-in outline-none">
            <Bell className="w-4 h-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-danger text-[10px] font-medium leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Popover.Button>

          <Popover.Panel className="w-80 p-0 mt-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="font-medium">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => markAllRead()}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notificationsLoading && notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-center text-slate-400">
                  Loading...
                </div>
              )}

              {!notificationsLoading && notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-center text-slate-400">
                  You're all caught up.
                </div>
              )}

              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n.id, n.is_read)}
                  className={`flex w-full gap-3 px-4 py-3 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50 ${
                    !n.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      !n.is_read ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium text-slate-500">
                      {n.label_en ?? n.type} · {n.ptw_code}
                    </span>
                    <span className="block text-sm text-slate-700 line-clamp-2">
                      {n.message}
                    </span>
                    <span className="block mt-0.5 text-[11px] text-slate-400">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="px-4 py-3 text-center border-t border-slate-200">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => navigate("/notifications")}
              >
                View all
              </button>
            </div>
          </Popover.Panel>
        </Popover>
        {/* END: Notifications */}

        {/* BEGIN: Search */}

        <Menu>
          <Menu.Button className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-white zoom-in intro-x">
            <User className="w-4 h-4 text-slate-600" />
          </Menu.Button>

          <Menu.Items className="w-56 mt-px text-white bg-primary">
            <Menu.Item className="hover:bg-white/5" onClick={() => navigate("/profile")}>
              <Lucide icon="User" className="w-4 h-4 mr-2" /> Profile
            </Menu.Item>

            <button onClick={handlelogout} className="w-full">
              <Menu.Item className="hover:bg-white/10">
                <Lucide icon="ToggleRight" className="w-6 h-6 mr-2" /> Logout
              </Menu.Item>
            </button>
          </Menu.Items>
        </Menu>
      </div>
      {/* END: Top Bar */}
    </>
  );
}

export default Main;