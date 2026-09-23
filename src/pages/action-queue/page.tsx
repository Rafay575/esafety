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
const ENDPOINT = "/api/v1/meta/dashboard/action-queue";

// ⚠️ Change to your real PTW detail route
const PTW_DETAIL_ROUTE = (id: number) => `/ptw/${id}`;

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
type ActionQueueRow = {
  id: number;
  ptw_code: string | null;
  type: string; // PLANNED | EMERGENCY | MISC
  status: string;
  status_label: string;
  pending_with: string;
  due_time: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
};

type ApiResponse = {
  data: {
    rows: ActionQueueRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
// Same colours as the dashboard so a status looks identical everywhere
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#F4A000",
  SUBMITTED: "#1684F8",
  SDO_RETURNED: "#F0445A",
  SDO_CANCELLED: "#F0445A",
  SDO_FORWARDED_TO_XEN: "#1684F8",
  XEN_RETURNED_TO_SDO: "#F0445A",
  XEN_REJECTED: "#F0445A",
  XEN_APPROVED_TO_PDC: "#13B76A",
  PDC_DELEGATED_TO_GRID: "#635BFF",
  GRID_PRECHECKS_DONE: "#635BFF",
  PTW_ISSUED: "#13B76A",
  IN_EXECUTION: "#1684F8",
  COMPLETION_SUBMITTED: "#13B76A",
  GRID_RESTORED_AND_CLOSED: "#13B76A",
  CANCELLATION_REQUESTED_BY_LS: "#F4A000",
  GRID_CANCELLATION_CONFIRMED_AND_CLOSED: "#13B76A",
  LS_RESUBMIT_TO_XEN: "#1684F8",
  XEN_RETURNED_TO_LS: "#F0445A",
  PDC_RETURNED_TO_LS: "#F0445A",
  LS_RESUBMIT_TO_PDC: "#1684F8",
  PDC_REJECTED: "#F0445A",
  CANCELLATION_APPROVED_BY_SDO: "#F4A000",
  PDC_CONFIRMED: "#13B76A",
  PENDING_PDC_CONFIRMATION: "#F4A000",
  GRID_RESOLVE_REQUIRED: "#F0445A",
  RE_SUBMITTED_TO_PDC: "#1684F8",
  NO_PTW_APPROVED_BY_SDO: "#F0445A",
};

const TYPE_COLORS: Record<string, string> = {
  PLANNED: "#1684F8",
  EMERGENCY: "#F0445A",
  MISC: "#635BFF",
};

const hexToRgba = (hex: string, alpha: number) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

// Handles both "2026-02-10T09:35:00.000000Z" and "2026-02-10 10:03:38"
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
   BADGES
   ═══════════════════════════════════════════════ */
const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span
    className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold"
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
   COLUMNS & ACTIONS
   ═══════════════════════════════════════════════ */
const columns: Column<ActionQueueRow>[] = [
  {
    key: "ptw_code",
    label: "PTW Code",
    className: "whitespace-nowrap",
    render: (row) =>
      row.ptw_code ? (
        <span className="font-semibold text-primary">{row.ptw_code}</span>
      ) : (
        <span className="text-slate-400">Request #{row.id}</span>
      ),
  },
  {
    key: "type",
    label: "Type",
    render: (row) => (
      <Badge color={TYPE_COLORS[row.type] ?? "#718096"}>
        {row.type === "EMERGENCY" && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        {capitalize(row.type)}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <Badge color={STATUS_COLORS[row.status] ?? "#718096"}>{row.status_label || row.status}</Badge>
    ),
  },
  {
    key: "pending_with",
    label: "Pending With",
    className: "whitespace-nowrap",
    render: (row) => row.pending_with || "—",
  },
  {
    key: "due_time",
    label: "Due",
    className: "whitespace-nowrap",
    render: (row) => (
      <div className="flex flex-col gap-1">
        <span className={clsx(row.is_overdue && "font-medium text-danger")}>
          {formatDateTime(row.due_time)}
        </span>
        {row.is_overdue && <Badge color="#F0445A">Overdue</Badge>}
      </div>
    ),
  },
  {
    key: "created_at",
    label: "Created",
    className: "whitespace-nowrap",
    render: (row) => formatDateTime(row.created_at),
  },
  {
    key: "updated_at",
    label: "Last Updated",
    className: "whitespace-nowrap",
    render: (row) => formatDateTime(row.updated_at),
  },
];

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function ActionQueuePage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ActionQueueRow[]>([]);
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
      setError(err?.response?.data?.message || "Failed to load the action queue.");
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
  const actions: TableAction<ActionQueueRow>[] = [
    {
      label: "View",
      icon: "Eye",
      onClick: (row) => navigate(PTW_DETAIL_ROUTE(row.id)),
    },
  ];

  return (
    <div className="p-5">
      <div className="mb-5">
        <div className="text-lg font-medium">Action Queue</div>
        <div className="mt-1 text-sm text-slate-500">
          PTWs that are currently waiting for action.
        </div>
      </div>

      <GenericTable<ActionQueueRow>
        title="Action Queue"
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