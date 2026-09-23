"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { api } from "@/lib/axios";
// ⚠️ Adjust this path to wherever your GenericTable file lives
import { GenericTable, Column, TableAction } from "@/components/Base/GenericTable";

/* ═══════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════ */
const ENDPOINT = "/api/v1/meta/dashboard/recent-activity";

// ⚠️ Change to your real PTW detail route
const PTW_DETAIL_ROUTE = (id: number) => `/ptw/${id}`;

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
type ActivityRow = {
  ptw_id: number;
  ptw_code: string | null;
  actor: string;
  role: string; // SDO | XEN | LS | PDC | GridOperator ...
  action: string; // e.g. GRID_RESTORED_AND_CLOSED
  notes: string | null;
  time: string; // "2026-09-21 11:22:36"
};

type ApiResponse = {
  data: {
    rows: ActivityRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
const ROLE_COLORS: Record<string, string> = {
  LS: "#1684F8",
  SDO: "#F4A000",
  XEN: "#635BFF",
  PDC: "#13B76A",
  GridOperator: "#0E9F9F",
};

const hexToRgba = (hex: string, alpha: number) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// "GRID_RESTORED_AND_CLOSED" -> "Grid Restored And Closed"
const humanize = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");

// "GridOperator" -> "Grid Operator"
const splitCamel = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

// "2026-09-21 11:22:36" -> "21 Sep 2026, 11:22"
const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/* ═══════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════ */
const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span
    className="inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold"
    style={{
      color,
      backgroundColor: hexToRgba(color, 0.08),
      borderColor: hexToRgba(color, 0.18),
    }}
  >
    {children}
  </span>
);

/* ═══════════════════════════════════════════════
   COLUMNS
   ═══════════════════════════════════════════════ */
const columns: Column<ActivityRow>[] = [
  {
    key: "time",
    label: "Time",
    className: "whitespace-nowrap",
    render: (row) => formatDateTime(row.time),
  },
  {
    key: "ptw_code",
    label: "PTW Code",
    className: "whitespace-nowrap",
    render: (row) =>
      row.ptw_code ? (
        <span className="font-semibold text-primary">{row.ptw_code}</span>
      ) : (
        <span className="text-slate-400">Request #{row.ptw_id}</span>
      ),
  },
  {
    key: "actor",
    label: "Actor",
    className: "whitespace-nowrap font-medium",
    render: (row) => row.actor || "—",
  },
  {
    key: "role",
    label: "Role",
    render: (row) => (
      <Badge color={ROLE_COLORS[row.role] ?? "#718096"}>{splitCamel(row.role || "—")}</Badge>
    ),
  },
  {
    key: "action",
    label: "Action",
    render: (row) => <Badge color="#475569">{humanize(row.action)}</Badge>,
  },
  {
    key: "notes",
    label: "Notes",
    className: "min-w-[240px] max-w-[380px]",
    render: (row) =>
      row.notes ? (
        <span className="whitespace-normal break-words">{row.notes}</span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
];

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function RecentActivityPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ignore responses from outdated requests (fast typing / quick page changes)
  const requestIdRef = useRef(0);

  // Wait until the user stops typing before calling the API, and go back to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (debouncedSearch) params.q = debouncedSearch;

      const res = await api.get<ApiResponse>(ENDPOINT, { params });
      if (requestId !== requestIdRef.current) return; // a newer request is in flight

      const payload = res.data.data;
      setRows(payload.rows ?? []);
      setTotal(payload.total ?? 0);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.response?.data?.message || "Failed to load recent activity.");
      setRows([]);
      setTotal(0);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, perPage, debouncedSearch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Note: GenericTable renders only the icon for each action (not the label)
  const actions: TableAction<ActivityRow>[] = [
    {
      label: "View PTW",
      icon: "Eye",
      onClick: (row) => navigate(PTW_DETAIL_ROUTE(row.ptw_id)),
    },
  ];

  return (
    <div className="p-5">
      <div className="mb-5">
        <div className="text-lg font-medium">Recent Activity</div>
        <div className="mt-1 text-sm text-slate-500">
          Latest actions taken on PTWs, newest first.
        </div>
      </div>

      <GenericTable<ActivityRow>
        title="Recent Activity"
        data={rows}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        onRetry={fetchRows}
        toolbarActions={
          <Button
            type="button"
            variant="outline-secondary"
            onClick={fetchRows}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Lucide icon="RefreshCw" className={clsx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
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
    </div>
  );
}