"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/axios";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { GenericTable, Column, TableAction } from "@/components/Base/GenericTable";
import { toast } from "sonner";
import { Loader } from "lucide-react";

// ---------- Types ----------
interface GridSession {
  id: number;
  user_id: number;
  user_name: string;
  sap_code: string;
  role: string;
  grid_id: number | null;
  is_active: boolean;
  device_name: string;
  device_model: string;
  ip_address: string;
  logged_in_at: string;
  logged_out_at: string | null;
  last_activity_at: string | null;
  active_ptw_count: number;
}

interface SessionsResponse {
  data: GridSession[];
  current_page: number;
  last_page: number;
  total: number;
}

const ROLES = ["PDC", "GridOperator"] as const;

export default function GridSessionsPage() {
  const [sessions, setSessions] = useState<GridSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [killingId, setKillingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
const [filters, setFilters] = useState({
  role: "",
  is_active: "",
});

  // Search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to first page on search change
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal state
  const [sessionToKill, setSessionToKill] = useState<GridSession | null>(null);
  const [isKillModalOpen, setIsKillModalOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: perPage,
        ...(filters.role && { role: filters.role }),
        ...(filters.is_active !== "" && { is_active: filters.is_active }),
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      };
      const { data } = await api.get<SessionsResponse>("/api/v1/grid-sessions", { params });
      setSessions(data.data);
      setTotal(data.total);
      setLastPage(data.last_page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filters, debouncedSearch]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openKillModal = (session: GridSession) => {
    if (!session.is_active) return; // disabled for inactive
    setSessionToKill(session);
    setIsKillModalOpen(true);
  };

  const closeKillModal = () => {
    setSessionToKill(null);
    setIsKillModalOpen(false);
  };

  const handleKillConfirm = async () => {
    if (!sessionToKill) return;
    setKillingId(sessionToKill.id);
    try {
      await api.patch(`/api/v1/grid-sessions/${sessionToKill.id}/kill`);
      toast.success("Session terminated");
      closeKillModal();
      fetchSessions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to kill session");
    } finally {
      setKillingId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  };

  // Columns
  const columns: Column<GridSession>[] = [
    {
      key: "user_name",
      label: "User",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.user_name}</div>
          <div className="text-xs text-slate-500">{row.sap_code}</div>
        </div>
      ),
    },
    { key: "role", label: "Role" },
    {
      key: "device",
      label: "Device",
      render: (row) => (
        <div>
          <div className="text-sm">{row.device_name}</div>
          <div className="text-xs text-slate-500">{row.device_model}</div>
        </div>
      ),
    },
    { key: "ip_address", label: "IP Address" },
    {
      key: "logged_in_at",
      label: "Logged In",
      render: (row) => formatDate(row.logged_in_at),
    },
    {
      key: "logged_out_at",
      label: "Logged Out",
      render: (row) => formatDate(row.logged_out_at),
    },
    {
      key: "last_activity_at",
      label: "Last Activity",
      render: (row) => formatDate(row.last_activity_at),
    },
    {
      key: "active_ptw_count",
      label: "Active PTWs",
      render: (row) => row.active_ptw_count,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset " +
            (row.is_active
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-gray-100 text-gray-500 ring-gray-200")
          }
        >
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (row.is_active ? "bg-emerald-500" : "bg-gray-400")
            }
          />
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Actions (kill button disabled for inactive handled by openKillModal guard)
  const actions: TableAction<GridSession>[] = [
    {
      label: "Kill Session",
      icon: "Power",
      onClick: (row) => openKillModal(row),
    },
  ];

  const filterToolbar = (
    <div className="flex items-center gap-2">
      <select
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.role}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, role: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">All Roles</option>
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.is_active}
        onChange={(e) => {
          setFilters((prev) => ({ ...prev, is_active: e.target.value }));
          setPage(1);
        }}
      >
        <option value="">All Sessions</option>
        <option value="1">Active Only</option>
        <option value="0">Inactive Only</option>
      </select>

      <Button variant="outline-secondary" onClick={fetchSessions} disabled={loading}>
        <Lucide icon="RefreshCw" className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <GenericTable
        title="Grid Sessions"
        data={sessions}
        columns={columns}
        actions={actions}
        loading={loading}
        error={null}
        onRetry={fetchSessions}
        toolbarActions={filterToolbar}
        page={page}
        perPage={perPage}
        total={total}
        search={search}
        onSearchChange={setSearch}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

      {/* Kill Session Confirmation Modal – preserved exactly as provided */}
      {isKillModalOpen && sessionToKill && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-0 !mt-0 " style={{ zIndex: 9999 }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Lucide icon="AlertTriangle" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Kill Session</h3>
              </div>
              <button
                onClick={closeKillModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Lucide icon="X" className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Are you sure you want to terminate the session for{" "}
              <span className="font-semibold">{sessionToKill.user_name}</span>?
              This action will immediately log them out and close any active PTWs.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline-secondary" onClick={closeKillModal}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleKillConfirm}
                disabled={killingId === sessionToKill.id}
                className="flex items-center gap-2"
              >
                {killingId === sessionToKill.id ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Lucide icon="Power" className="h-4 w-4" />
                )}
                Confirm Kill
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}