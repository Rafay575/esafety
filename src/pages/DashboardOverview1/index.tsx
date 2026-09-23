"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { parseJSON } from "date-fns";
import ExcelJS from "exceljs";
/* ═══════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════ */
const COLORS = {
  blue: "#1684F8",
  green: "#13B76A",
  amber: "#F4A000",
  red: "#F0445A",
  greenSoft: "#EAF8F0",
  amberSoft: "#FFF4DB",
  blueSoft: "#EAF4FF",
  redSoft: "#FFF0F2",
  slate500: "#718096",
};

// Status type
export type PtwStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "SDO_RETURNED"
  | "SDO_CANCELLED"
  | "SDO_FORWARDED_TO_XEN"
  | "XEN_RETURNED_TO_SDO"
  | "XEN_REJECTED"
  | "XEN_APPROVED_TO_PDC"
  | "PDC_DELEGATED_TO_GRID"
  | "GRID_PRECHECKS_DONE"
  | "PTW_ISSUED"
  | "IN_EXECUTION"
  | "COMPLETION_SUBMITTED"
  | "GRID_RESTORED_AND_CLOSED"
  | "CANCELLATION_REQUESTED_BY_LS"
  | "GRID_CANCELLATION_CONFIRMED_AND_CLOSED"
  | "LS_RESUBMIT_TO_XEN"
  | "XEN_RETURNED_TO_LS"
  | "PDC_RETURNED_TO_LS"
  | "LS_RESUBMIT_TO_PDC"
  | "PDC_REJECTED"
  | "CANCELLATION_APPROVED_BY_SDO"
  | "PDC_CONFIRMED"
  | "PENDING_PDC_CONFIRMATION"
  | "GRID_RESOLVE_REQUIRED"
  | "RE_SUBMITTED_TO_PDC"
  | "NO_PTW_APPROVED_BY_SDO";

const STATUS_COLORS: Record<PtwStatus, string> = {
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

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
type TimeRange = "today" | "week" | "month";

// Dropdown options that now come inside the dashboard response (filter_options)
type FilterOption = {
  id: number;
  name: string;
  code?: string;
  region_id?: number;
  is_active?: boolean;
};

type CanFilter = { circle: boolean; division: boolean; sub_division: boolean };

type FilterOptions = {
  role?: string;
  can_filter: CanFilter;
  circles: FilterOption[];
  divisions: FilterOption[];
  sub_divisions: FilterOption[];
};

type StatLevel = "circle" | "division" | "sub_division";

type PtwStatRow = {
  level: StatLevel;
  id: number;
  name: string;
  total: number;
  active: number;
  issued: number;
  closed: number;
  cancelled: number;
};

type TypeCounts = { all: number; planned: number; emergency: number; misc: number };

type ActionQueueItem = {
  id: number;
  ptw_code: string | null;
  type: string;
  status: PtwStatus;
  status_label?: string;
  pending_with: string;
  due_time: string | null;
  is_overdue: boolean;
};

type ActivityItem = {
  actor: string;
  action: string;
  notes: string | null;
  time: string;
};

type PtwRow = {
  id: string;
  ptw_code: string;
  feeder: string;
  type: "Planned" | "Emergency" | "Misc";
  status: PtwStatus;
  circle: string;
  division: string;
  subDivision: string;
  lsName: string;
  start: string;
  evidenceCompletion: number;
  rolesPath: string;
};

type ApiResponse = {
  data: {
    scope?: { role: string };
    filter_options?: FilterOptions;
    summary: {
      active_ptws: number;
      issued: number;
      issued_ever?: number;
      closed: number;
      total_filtered: number;
    };
    ptw_volume_trend: {
      labels: string[];
      values: number[];
    };
    ptw_statistics?: PtwStatRow[];
    circle_wise_stats?: {
      circle: string;
      active: number;
      closed: number;
      total: number;
    }[];
    analytics_overview: {
      total_permits: number;
      type_distribution: {
        type: string;
        count: number;
        percent: number;
      }[];
      evidence_stats?: {
        total_ptws: number;
        with_evidence: number;
        without_evidence: number;
        coverage_percent: number;
        by_type?: { type: string; count: number }[];
      };
    };
    live_ptw_requests: {
      counts_by_type?: TypeCounts;
      data: {
        id: number;
        ptw_code: string | null;
        feeder: string;
        type: string;
        status: PtwStatus;
         division: string;
        circle: string;
        sub_division: string;
        ls: string;
        due_time: string | null;
        created_at?: string;
      }[];
      current_page: number;
      last_page: number;
      total: number;
    };
    action_queue: ActionQueueItem[];
    recent_activity: ActivityItem[];
  };
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
const PER_PAGE = 8;

// 0 = Sunday, 1 = Monday, ...  (change this if your week starts on another day)
const WEEK_STARTS_ON = 1;

const LEVEL_LABELS: Record<StatLevel, string> = {
  circle: "Circle",
  division: "Division",
  sub_division: "Sub Division",
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// "GRID_RESTORED_AND_CLOSED" -> "Grid Restored And Closed"
const humanize = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatStatus = (status: PtwStatus) => humanize(status);

const formatNumber = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US") : "0");

// Local (not UTC) YYYY-MM-DD so the date never shifts by a day due to timezone
const toLocalISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Calendar-based ranges (never "last 7 / 30 days"):
 *  - today : today only
 *  - week  : current calendar week, clamped to the current month
 *  - month : 1st to last day of the current month
 */
const getDateRange = (range: TimeRange, now: Date = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  if (range === "today") return { from: today, to: today };

  if (range === "week") {
    const diff = (today.getDay() - WEEK_STARTS_ON + 7) % 7;
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    return {
      from: weekStart.getTime() < monthStart.getTime() ? monthStart : weekStart,
      to: weekEnd.getTime() > monthEnd.getTime() ? monthEnd : weekEnd,
    };
  }

  return { from: monthStart, to: monthEnd };
};

const formatRangeLabel = (from: Date, to: Date) => {
  const fmt = (d: Date, withYear = false) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    });
  if (from.getTime() === to.getTime()) return fmt(from, true);
  return `${fmt(from)} – ${fmt(to, true)}`;
};

// "2026-09-05" -> "5 Sep"
const formatTrendLabel = (label: string) => {
  const d = new Date(`${label}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? label
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// "2026-09-19 15:16:35" -> "15:16" (today) or "18 Sep, 15:16"
const formatActivityTime = (value: string) => {
  if (!value) return "";
  const [datePart, timePart = ""] = value.replace("T", " ").split(" ");
  const hhmm = timePart.slice(0, 5);
  if (datePart === toLocalISODate(new Date())) return hhmm;
  const d = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${hhmm}`;
};

const fade = {
  hidden: { opacity: 0, y: 10 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

type IconName = React.ComponentProps<typeof Lucide>["icon"];

/* ═══════════════════════════════════════════════
   SHARED PRIMITIVES
   ═══════════════════════════════════════════════ */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "rounded-[18px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]",
      className
    )}
  >
    {children}
  </div>
);

const IconTile: React.FC<{
  icon: IconName;
  tone: "green" | "amber" | "blue" | "red";
}> = ({ icon, tone }) => {
  const styleMap = {
    green: { bg: COLORS.greenSoft, fg: COLORS.green },
    amber: { bg: COLORS.amberSoft, fg: COLORS.amber },
    blue: { bg: COLORS.blueSoft, fg: COLORS.blue },
    red: { bg: COLORS.redSoft, fg: COLORS.red },
  };
  const s = styleMap[tone];
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14"
      style={{ backgroundColor: s.bg }}
    >
      <Lucide icon={icon} className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: s.fg }} />
    </div>
  );
};

const SectionHeader: React.FC<{
  title: string;
  right?: React.ReactNode;
}> = ({ title, right }) => (
  <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#10213C]">
      {title}
    </h2>
    {right}
  </div>
);

const StatusBadge: React.FC<{ status: PtwStatus }> = ({ status }) => {
  const color = STATUS_COLORS[status] ?? COLORS.slate500;
  return (
    <span
      className="inline-flex shrink-0 rounded-md border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.02em]"
      style={{
        color,
        backgroundColor: hexToRgba(color, 0.09),
        borderColor: hexToRgba(color, 0.16),
      }}
    >
      {formatStatus(status)}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { color: string; bg: string; border: string; dot?: boolean }> = {
    Planned: { color: "#1684F8", bg: "rgba(22,132,248,0.07)", border: "rgba(22,132,248,0.14)" },
    Emergency: { color: "#F0445A", bg: "rgba(240,68,90,0.07)", border: "rgba(240,68,90,0.14)", dot: true },
    Misc: { color: "#635BFF", bg: "rgba(99,91,255,0.07)", border: "rgba(99,91,255,0.14)" },
  };
  const s = map[type] ?? { color: "#718096", bg: "rgba(113,128,150,0.07)", border: "rgba(113,128,150,0.14)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-semibold"
      style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
    >
      {s.dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {type}
    </span>
  );
};

const TooltipBox = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      {label && <div className="mb-1 font-semibold text-slate-700">{label}</div>}
      <div className="space-y-1">
        {payload.map((p: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span className="text-slate-500">{p.name}</span>
            <span className="ml-auto font-semibold text-slate-800">{formatNumber(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   LOADERS
   ═══════════════════════════════════════════════ */

// Thin animated bar pinned to the top of the screen while any request is running
const TopProgressBar: React.FC = () => (
  <div
    className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-blue-100/60"
    role="progressbar"
    aria-label="Loading"
  >
    <motion.div
      className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#1684F8] to-[#635BFF]"
      initial={{ x: "-100%" }}
      animate={{ x: "300%" }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// Dims the existing content and shows a spinner pill while refreshing
const LoadingOverlay: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="pointer-events-none absolute inset-0 z-20 rounded-[18px] bg-white/60 backdrop-blur-[1.5px]"
    role="status"
    aria-live="polite"
  >
    <div className="sticky top-[38vh] flex justify-center pt-20">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-xl shadow-slate-200/70">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-xs font-semibold text-slate-600">Updating dashboard…</span>
      </div>
    </div>
  </motion.div>
);

// Shown on the very first load (no data yet)
const PageLoader: React.FC = () => (
  <Card className="mt-3 flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
    <div className="text-xs font-medium text-slate-500">Loading dashboard…</div>
  </Card>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <Card className="mt-3 flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
      <Lucide icon="AlertCircle" className="h-6 w-6 text-rose-500" />
    </div>
    <div className="text-sm font-semibold text-slate-700">Couldn't load the dashboard</div>
    <div className="max-w-md text-xs text-slate-500">{message}</div>
    <Button variant="primary" onClick={onRetry} className="mt-1 h-9 rounded-lg bg-[#0B69DC] px-4 text-xs font-medium">
      Try again
    </Button>
  </Card>
);

/* ═══════════════════════════════════════════════
   SELECT CONTROL
   ═══════════════════════════════════════════════ */
const SelectControl: React.FC<{
  icon?: IconName;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ icon, value, onChange, disabled, className, children }) => {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options = React.Children.toArray(children)
    .filter((c): c is React.ReactElement<any> => React.isValidElement(c))
    .map((c) => ({ value: c.props.value as string, label: c.props.children as React.ReactNode }));

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && rootRef.current) {
      // Controls in the right half of the screen open their menu towards the left,
      // so the menu never runs off-screen on phones / narrow windows.
      const rect = rootRef.current.getBoundingClientRect();
      setAlignRight(rect.left + rect.width / 2 > window.innerWidth / 2);
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left shadow-sm transition-all duration-150 sm:min-w-[130px]",
          "hover:border-slate-300 hover:shadow-md",
          open && "border-blue-300 ring-4 ring-blue-50",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60 hover:border-slate-200 hover:shadow-sm",
          className
        )}
      >
        {icon && <Lucide icon={icon} className="h-4 w-4 shrink-0 text-slate-400" />}
        <span className="flex-1 truncate text-xs font-medium text-slate-700">{selected?.label ?? "Select"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="shrink-0">
          <Lucide icon="ChevronDown" className="h-3.5 w-3.5 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute top-[calc(100%+6px)] z-30 max-h-64 w-max min-w-full max-w-[calc(100vw_-_1.5rem)] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70",
              alignRight ? "right-0" : "left-0"
            )}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange({ target: { value: o.value } });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                  o.value === value ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Lucide icon="Check" className="h-3.5 w-3.5 shrink-0 text-blue-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   DASHBOARD TOOLBAR
   Location dropdowns are driven by filter_options.can_filter
   from the dashboard API (circle / division / sub_division).
   ═══════════════════════════════════════════════ */
const DashboardToolbar: React.FC<{
  timeRange: TimeRange;
  onTimeRangeChange: (v: TimeRange) => void;
  dateRangeLabel: string;

  filterOptions: FilterOptions | null;

  selectedCircle: string;
  onCircleChange: (v: string) => void;
  selectedDivision: string;
  onDivisionChange: (v: string) => void;
  selectedSubDivision: string;
  onSubDivisionChange: (v: string) => void;

  statusFilter: PtwStatus[];
  onStatusChange: (v: PtwStatus[]) => void;

  isLoading: boolean;
  onRefresh: () => void;
  exportCSV: () => void;
}> = ({
  timeRange, onTimeRangeChange, dateRangeLabel,
  filterOptions,
  selectedCircle, onCircleChange,
  selectedDivision, onDivisionChange,
  selectedSubDivision, onSubDivisionChange,
  statusFilter, onStatusChange,
  isLoading, onRefresh, exportCSV,
}) => {
  const canFilter = filterOptions?.can_filter;
  const activeOnly = (list?: FilterOption[]) => (list ?? []).filter((o) => o.is_active !== false);
  const circles = activeOnly(filterOptions?.circles);
  const divisions = activeOnly(filterOptions?.divisions);
  const subDivisions = activeOnly(filterOptions?.sub_divisions);

  // Before the first response we don't know which dropdowns the user may see
  const showSkeleton = !filterOptions && isLoading;

  // A child list is filled by the API after its parent is chosen
  const divisionsPending = isLoading && selectedCircle !== "ALL" && divisions.length === 0;
  const subDivisionsPending = isLoading && selectedDivision !== "ALL" && subDivisions.length === 0;

  return (
    <Card className="px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
            <Lucide icon="ShieldCheck" className="h-5 w-5 text-[#1684F8]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-semibold leading-tight tracking-[-0.02em] text-[#10213C] sm:text-[20px]">
              Dashboard
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live grid monitoring
              </span>
              <span className="font-medium text-slate-400">{dateRangeLabel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:flex-wrap md:items-center">
          <SelectControl
            icon="CalendarDays"
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </SelectControl>

          {showSkeleton && (
            <>
              <div className="h-9 animate-pulse rounded-lg bg-slate-100 sm:min-w-[130px]" />
              <div className="h-9 animate-pulse rounded-lg bg-slate-100 sm:min-w-[130px]" />
            </>
          )}

          {canFilter?.circle && (
            <SelectControl
              value={selectedCircle}
              disabled={circles.length === 0}
              onChange={(e) => onCircleChange(e.target.value)}
            >
              <option value="ALL">All Circles</option>
              {circles.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </SelectControl>
          )}

          {canFilter?.division && (
            <SelectControl
              value={selectedDivision}
              disabled={divisions.length === 0}
              onChange={(e) => onDivisionChange(e.target.value)}
            >
              <option value="ALL">{divisionsPending ? "Loading divisions..." : "All Divisions"}</option>
              {divisions.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </SelectControl>
          )}

          {canFilter?.sub_division && (
            <SelectControl
              value={selectedSubDivision}
              disabled={subDivisions.length === 0}
              onChange={(e) => onSubDivisionChange(e.target.value)}
            >
              <option value="ALL">{subDivisionsPending ? "Loading sub divisions..." : "All Sub Divisions"}</option>
              {subDivisions.map((sd) => (
                <option key={sd.id} value={String(sd.id)}>{sd.name}</option>
              ))}
            </SelectControl>
          )}

          <SelectControl
            value={statusFilter[0] ?? "ALL"}
            onChange={(e) => onStatusChange(e.target.value === "ALL" ? [] : [e.target.value as PtwStatus])}
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_COLORS).map((status) => (
              <option value={status} key={status}>{status.replace(/_/g, " ")}</option>
            ))}
          </SelectControl>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 md:block" />

          <div className="col-span-full flex items-center gap-2 md:contents">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh"
              aria-label="Refresh dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lucide icon="RefreshCw" className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </motion.button>

         
          </div>
        </div>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   METRIC CARD
   ═══════════════════════════════════════════════ */
const MetricCard: React.FC<{
  label: string;
  value: number;
  helper: string;
  tone: "green" | "amber" | "blue" | "red";
  icon: IconName;
}> = ({ label, value, helper, tone, icon }) => {
  const helperClass = { green: "text-emerald-600", amber: "text-amber-600", blue: "text-blue-600", red: "text-rose-500" }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{label}</div>
          <div className="mt-1 text-[26px] font-semibold leading-none tabular-nums text-[#10213C] sm:text-[28px]">{formatNumber(value)}</div>
          <div className={cn("mt-3 text-[11px] font-medium", helperClass)}>{helper}</div>
        </div>
        <IconTile icon={icon} tone={tone} />
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   MULTI-SEGMENT DONUT (reusable)
   ═══════════════════════════════════════════════ */
const MultiSegmentDonut: React.FC<{
  segments: { label: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  stroke?: number;
}> = ({ segments, centerValue, centerLabel, size = 128, stroke = 10 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const gap = 14;
  const activeSegs = segments.filter((s) => s.value > 0);
  const totalGap = gap * activeSegs.length;
  const available = circumference - totalGap;

  let acc = 0;
  const arcs = activeSegs.map((seg) => {
    const len = (seg.value / total) * available;
    const arc = { ...seg, len, offset: -acc, pct: Math.round((seg.value / total) * 100) };
    acc += len + gap;
    return arc;
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#EDF1F6" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <motion.circle
            key={arc.label}
            cx={center} cy={center} r={radius}
            fill="none" stroke={arc.color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc.len} ${circumference - arc.len}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: arc.offset }}
            transition={{ delay: i * 0.15, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(arc.color, 0.3)})` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-extrabold leading-none tabular-nums text-slate-800">{centerValue}</span>
        <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">{centerLabel}</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   ANALYTICS CARD — Type split + Evidence coverage
   ═══════════════════════════════════════════════ */
const AnalyticsCard: React.FC<{
  split: { Planned: number; Emergency: number; Misc: number };
  evidenceValue: number; // 0..1
  withEvidence: number;
  withoutEvidence: number;
}> = ({ split, evidenceValue, withEvidence, withoutEvidence }) => {
  const sum = split.Planned + split.Emergency + split.Misc;
  const total = sum || 1;
  const pct = Math.round(evidenceValue * 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - evidenceValue);
  const strokeColor = pct >= 80 ? "#13B76A" : pct >= 50 ? "#F4A000" : "#F0445A";
  const glowColor = hexToRgba(strokeColor, 0.3);
  const milestones = [25, 50, 75, 100];

  const segments = [
    { label: "Planned", value: split.Planned, color: "#1684F8", icon: "CalendarClock" as IconName },
    { label: "Emergency", value: split.Emergency, color: "#F0445A", icon: "AlertTriangle" as IconName },
    { label: "Misc", value: split.Misc, color: "#635BFF", icon: "Layers" as IconName },
  ];

  // Largest and second-largest type for the summary line
  const ranked = [...segments].sort((a, b) => b.value - a.value);
  const first = ranked[0];
  const second = ranked[1];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50">
            <Lucide icon="BarChart3" className="h-4 w-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-bold tracking-[-0.01em] text-[#10213C]">Analytics Overview</h2>
            <p className="truncate text-[10px] text-slate-400">Type distribution & evidence completion</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tabular-nums text-slate-500">
          {formatNumber(sum)} permits
        </div>
      </div>

      {/* Three donuts */}
      <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* ── Evidence Donut ── */}
        <div className="flex flex-col items-center px-5 py-5">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Evidence</div>

          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-35" style={{ backgroundColor: glowColor }} />
            <div className="relative h-[130px] w-[130px]">
              <svg viewBox="0 0 100 100" className="-rotate-90">
                {milestones.map((m) => {
                  const angle = (m / 100) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const cx = 50 + (radius + 5) * Math.cos(rad);
                  const cy = 50 + (radius + 5) * Math.sin(rad);
                  const hit = pct >= m;
                  return <circle key={m} cx={cx} cy={cy} r={hit ? 2.2 : 1.4} fill={hit ? strokeColor : "#D1D9E6"} opacity={hit ? 1 : 0.4} />;
                })}
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#EDF1F6" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r={radius} fill="none" stroke={strokeColor} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-extrabold leading-none tabular-nums" style={{ color: strokeColor }}>{pct}%</span>
                <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">Coverage</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            {milestones.map((m) => {
              const hit = pct >= m;
              return (
                <div key={m} className="flex h-5 w-5 items-center justify-center rounded-md text-[8px] font-bold" style={{ color: hit ? strokeColor : "#B0BAC9", backgroundColor: hit ? hexToRgba(strokeColor, 0.1) : "#F3F6FA" }}>
                  {hit ? <Lucide icon="Check" className="h-3 w-3" /> : m}
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid w-full grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-[9px] text-slate-400">With evidence</div>
              <div className="mt-0.5 text-[11px] font-bold tabular-nums" style={{ color: strokeColor }}>
                {formatNumber(withEvidence)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-[9px] text-slate-400">Without</div>
              <div className="mt-0.5 text-[11px] font-bold tabular-nums text-slate-700">
                {formatNumber(withoutEvidence)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Type By Percentage ── */}
        <div className="flex flex-col items-center px-5 py-5">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">By Percentage</div>

          <MultiSegmentDonut
            segments={segments}
            centerValue="%"
            centerLabel="Share"
            size={120}
            stroke={9}
          />

          <div className="mt-4 w-full space-y-1.5">
            {segments.map((s) => {
              const segPct = Math.round((s.value / total) * 100);
              return (
                <div key={s.label} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-slate-50">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 text-[10px] font-medium text-slate-600">{s.label}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{segPct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Type By Count ── */}
        <div className="flex flex-col items-center px-5 py-5">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">By Count</div>

          <MultiSegmentDonut
            segments={segments}
            centerValue={formatNumber(sum)}
            centerLabel="Permits"
            size={120}
            stroke={9}
          />

          <div className="mt-4 w-full space-y-1.5">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-slate-50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: hexToRgba(s.color, 0.1) }}>
                  <Lucide icon={s.icon} className="h-3 w-3" style={{ color: s.color }} />
                </div>
                <span className="flex-1 text-[10px] font-medium text-slate-600">{s.label}</span>
                <span className="text-[10px] font-bold tabular-nums text-slate-800">{formatNumber(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom summary */}
      <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5">
        <Lucide icon="PieChart" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="text-[10px] leading-4 text-slate-500">
          <span className="font-bold" style={{ color: first.color }}>{first.label}</span> leads at{" "}
          <span className="font-bold" style={{ color: first.color }}>{Math.round((first.value / total) * 100)}%</span>
          {" · "}
          <span className="font-bold" style={{ color: second.color }}>{second.label}</span> at{" "}
          <span className="font-bold" style={{ color: second.color }}>{Math.round((second.value / total) * 100)}%</span>
          {" · "}
          <span className="font-bold" style={{ color: strokeColor }}>Evidence</span>{" "}
          <span className="font-bold" style={{ color: strokeColor }}>{pct}%</span>
        </span>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   LIVE PTW TABLE (external pagination, table on desktop / cards on mobile)
   ═══════════════════════════════════════════════ */
const EmptyResults: React.FC<{ search: string; onClear: () => void }> = ({ search, onClear }) => (
  <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
      <Lucide icon="SearchX" className="h-6 w-6 text-slate-300" />
    </div>
    <div className="text-[13px] font-semibold text-slate-500">No results found</div>
    <div className="text-[11px] text-slate-400">Try adjusting your search or filter criteria</div>
    {search && (
      <button onClick={onClear} className="mt-1 rounded-lg bg-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200">
        Clear search
      </button>
    )}
  </div>
);

const LivePtwTable: React.FC<{
  rows: PtwRow[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  typeCounts?: TypeCounts;
  onSelect: (row: PtwRow) => void;
  exportCSV: () => void;
  isExporting: boolean;
}> = ({ rows, totalResults, currentPage, totalPages, onPageChange, search, setSearch, typeFilter, setTypeFilter, typeCounts, onSelect, exportCSV , isExporting}) => {
  const srStart = (currentPage - 1) * PER_PAGE + 1;
  const srEnd = Math.min(currentPage * PER_PAGE, totalResults);
  const paginated = rows;

  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const typeOptions = ["ALL", "Planned", "Emergency", "Misc"] as const;
  const countFor = (t: (typeof typeOptions)[number]) => {
    if (!typeCounts) return undefined;
    return { ALL: typeCounts.all, Planned: typeCounts.planned, Emergency: typeCounts.emergency, Misc: typeCounts.misc }[t];
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <h3 className="text-[13px] font-bold tracking-[-0.01em] text-[#10213C]">Live PTW Requests</h3>
              <p className="mt-0.5 text-[10px] text-slate-400">Tap a row to open the full PTW workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 lg:flex-none">
              <Lucide icon="Search" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, feeder, LS..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-8 text-[11px] text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 lg:w-[210px]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                  <Lucide icon="X" className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="hidden h-5 w-px bg-slate-200 sm:block" />

           <motion.div className="flex-1 md:flex-none" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
 <Button
  variant="outline-secondary"
  onClick={exportCSV}
  disabled={isExporting}
  className="h-9 shrink-0 rounded-lg px-3 text-[11px] disabled:cursor-not-allowed disabled:opacity-70"
>
  {isExporting ? (
    <>
      <span className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Exporting…
    </>
  ) : (
    <>
      <Lucide icon="Download" className="mr-1.5 h-3.5 w-3.5" />
      Export
    </>
  )}
</Button>
</motion.div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {typeOptions.map((t) => {
            const active = typeFilter === t;
            const count = countFor(t);
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all duration-200",
                  active ? "bg-[#0B69DC] text-white shadow-[0_4px_12px_rgba(11,105,220,.2)]" : "bg-slate-100/80 text-slate-500 hover:bg-slate-200/60"
                )}
              >
                {t === "Emergency" && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                {t === "ALL" ? "All Types" : t}
                {count !== undefined && (
                  <span className={cn("tabular-nums", active ? "text-white/75" : "text-slate-400")}>
                    {formatNumber(count)}
                  </span>
                )}
              </button>
            );
          })}
          <div className="ml-auto text-[10px] tabular-nums text-slate-400">{formatNumber(totalResults)} result{totalResults !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* ── Mobile: card list ── */}
      <div className="divide-y divide-slate-100 md:hidden">
        {paginated.length === 0 ? (
          <EmptyResults search={search} onClear={() => setSearch("")} />
        ) : (
          paginated.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-50"
              style={{ borderLeft: `3px solid ${STATUS_COLORS[r.status] ?? "#1684F8"}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-[#0B74E5]">
                  <Lucide icon="FileText" className="h-3 w-3 shrink-0 text-blue-300" />
                  <span className="truncate">{r.id}</span>
                </span>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-1.5 text-[12px] font-medium text-slate-700">{r.feeder}</div>
             <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
  <TypeBadge type={r.type} />
  <span className="font-semibold text-slate-600">{r.circle}</span>
  {r.division && <span className="text-slate-400">· {r.division}</span>}
  {r.subDivision && <span className="text-slate-400">· {r.subDivision}</span>}
</div>
              <div className="mt-1 text-[10px] text-slate-400">LS: {r.lsName}</div>
            </button>
          ))
        )}
      </div>

      {/* ── Desktop: table ── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="w-12 px-3 py-3 text-center text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Sr</th>
              <th className="px-4 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">PTW ID</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Feeder</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Type</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Status</th>
<th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Circle</th>
<th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Division</th>
<th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Sub Division</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">LS</th>
              <th className="w-[130px] px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Evidence</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Due In</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyResults search={search} onClear={() => setSearch("")} />
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {paginated.map((r, index) => {
                  const evidPct = Math.round(r.evidenceCompletion * 100);
                  const evidColor = evidPct >= 80 ? "#13B76A" : evidPct >= 50 ? "#F4A000" : "#F0445A";

                  return (
                    <motion.tr
                      key={r.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => onSelect(r)}
                      className="group cursor-pointer border-b border-slate-50 text-[11px] text-slate-600 transition-all duration-150"
                      style={{ borderLeftWidth: 3, borderLeftColor: "transparent" }}
                      onMouseEnter={(e) => {
                        const sc = STATUS_COLORS[r.status] ?? "#1684F8";
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderLeftColor = sc;
                        el.style.backgroundColor = hexToRgba(sc, 0.025);
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderLeftColor = "transparent";
                        el.style.backgroundColor = "";
                      }}
                    >
                      <td className="px-3 py-3 text-center">
                        <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold tabular-nums transition-colors duration-150", "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500")}>{srStart + index}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 font-bold text-[#0B74E5] transition group-hover:underline decoration-blue-200 underline-offset-2">
                          <Lucide icon="FileText" className="h-3 w-3 text-blue-300 group-hover:text-blue-500" />
                          {r.ptw_code}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">{r.feeder}</td>
                      <td className="px-3 py-3"><TypeBadge type={r.type} /></td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                     <td className="px-3 py-3 font-semibold text-slate-700">{r.circle}</td>
<td className="px-3 py-3 text-slate-600">{r.division || "—"}</td>
<td className="px-3 py-3 text-slate-600">{r.subDivision || "—"}</td>
                      <td className="px-3 py-3 text-slate-600">{r.lsName}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1">
                            <div className="h-[5px] overflow-hidden rounded-full bg-slate-100">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${evidPct}%` }}
                                transition={{ duration: 0.5, delay: index * 0.03 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${hexToRgba(evidColor, 0.45)}, ${evidColor})` }}
                              />
                            </div>
                          </div>
                          <span className="w-9 text-right text-[9px] font-bold tabular-nums" style={{ color: evidColor }}>{evidPct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-slate-300">—</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {totalResults > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="text-[10px] text-slate-400">
            Showing <span className="font-semibold text-slate-600">{formatNumber(srStart)}–{formatNumber(srEnd)}</span> of{" "}
            <span className="font-semibold text-slate-600">{formatNumber(totalResults)}</span> entries
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 hover:text-slate-600">
              <Lucide icon="ChevronLeft" className="h-3.5 w-3.5" />
            </button>
            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`dots-${i}`} className="flex h-7 w-7 items-center justify-center text-[10px] text-slate-300">···</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn("flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold tabular-nums transition-all duration-200", p === currentPage ? "bg-[#0B69DC] text-white shadow-[0_3px_10px_rgba(11,105,220,.25)]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700")}
                >
                  {p}
                </button>
              )
            )}
            <button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 hover:text-slate-600">
              <Lucide icon="ChevronRight" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   ACTION QUEUE
   ═══════════════════════════════════════════════ */
const ActionQueue: React.FC<{ items: ActionQueueItem[] }> = ({ items }) => {
  const navigate = useNavigate();
  return (
    <Card className="p-3.5">
      <SectionHeader
        title="My Action Queue"
        right={
          <button
            type="button"
            onClick={() => navigate("/action-queue")}
            className="text-[10px] font-medium text-[#0B69DC] transition hover:text-[#0958b8] hover:underline"
          >
            View All →
          </button>
        }
      />
      <div className="space-y-1.5">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-[10px] text-slate-400">
            Nothing pending right now
          </div>
        )}
        {items.slice(0, 4).map((item, index) => {
          const isOverdue = item.is_overdue;
          const icon: IconName = isOverdue ? "AlertCircle" : "Clock";
          const iconStyle = isOverdue ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500";
          const badgeStyle = isOverdue ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500";
          const subtitle = item.status_label ? `${item.status_label} · ${item.pending_with}` : item.pending_with;
          return (
            <div key={item.id ?? index} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2">
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", iconStyle)}>
                <Lucide icon={icon} className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-semibold text-slate-700">
                  {item.ptw_code || `Request #${item.id}`}
                </div>
                <div className="truncate text-[9px] text-slate-500" title={subtitle}>{subtitle}</div>
              </div>
              <span className={cn("shrink-0 rounded-md px-2 py-1 text-[9px] font-medium", badgeStyle)}>
                {isOverdue ? "Overdue" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   RECENT ACTIVITY
   ═══════════════════════════════════════════════ */
const RecentActivity: React.FC<{ items: ActivityItem[] }> = ({ items }) => {
  const  navigate = useNavigate();
  return (
    <Card className="p-3.5">
      <SectionHeader title="Recent PTW Activity"  right={
          <button
            type="button"
            onClick={() => navigate("/recent-activity")}
            className="text-[10px] font-medium text-[#0B69DC] transition hover:text-[#0958b8] hover:underline"
          >
            View All →
          </button>
        } />
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-[10px] text-slate-400">
          No recent activity
        </div>
      ) : (
        <div className="relative space-y-2.5 pl-4">
          <div className="absolute bottom-2 left-[5px] top-2 w-px bg-blue-100" />
          {items.slice(0, 4).map((item, index) => (
            <div key={index} className="relative flex gap-2">
              <span className="absolute -left-[15px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#1684F8] shadow-[0_0_0_2px_rgba(22,132,248,.16)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] font-semibold text-slate-700">{item.actor}</span>
                  <span className="shrink-0 text-[8px] tabular-nums text-slate-400">{formatActivityTime(item.time)}</span>
                </div>
                <div className="text-[9px] leading-4 text-slate-500">
                  <span className="font-medium text-slate-600">{humanize(item.action)}</span>
                  {item.notes ? ` - ${item.notes}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════ */
export default function EsafetyDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [selectedCircle, setSelectedCircle] = useState("ALL");
  const [selectedDivision, setSelectedDivision] = useState("ALL");
  const [selectedSubDivision, setSelectedSubDivision] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<PtwStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState(1);
const [isExporting, setIsExporting] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse["data"] | null>(null);

  // Ignore responses from outdated requests (fast filter changes)
  const requestIdRef = useRef(0);
  const navigate = useNavigate();
  /* ── Filter handlers (every change goes back to page 1) ── */
  const handleTimeRangeChange = (v: TimeRange) => {
    setTimeRange(v);
    setPage(1);
  };
  const handleCircleChange = (v: string) => {
    setSelectedCircle(v);
    setSelectedDivision("ALL");
    setSelectedSubDivision("ALL");
    setPage(1);
  };
  const handleDivisionChange = (v: string) => {
    setSelectedDivision(v);
    setSelectedSubDivision("ALL");
    setPage(1);
  };
  const handleSubDivisionChange = (v: string) => {
    setSelectedSubDivision(v);
    setPage(1);
  };
  const handleStatusChange = (v: PtwStatus[]) => {
    setStatusFilter(v);
    setPage(1);
  };
  const handleTypeChange = (v: string) => {
    setTypeFilter(v);
    setPage(1);
  };

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Calendar-based date range ── */
  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);
  const dateRangeLabel = useMemo(
    () => formatRangeLabel(dateRange.from, dateRange.to),
    [dateRange]
  );

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setApiLoading(true);
    setApiError(null);
    try {
      const params: Record<string, string | number> = {
        from: toLocalISODate(dateRange.from),
        to: toLocalISODate(dateRange.to),
        page,
        per_page: PER_PAGE,
      };
      if (selectedCircle !== "ALL") params.circle_id = selectedCircle;
      if (selectedDivision !== "ALL") params.division_id = selectedDivision;
      if (selectedSubDivision !== "ALL") params.sub_division_id = selectedSubDivision;
      if (statusFilter.length === 1) params.status = statusFilter[0];
      if (typeFilter !== "ALL") params.type = typeFilter.toUpperCase();
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const response = await api.get<ApiResponse>("/api/v1/meta/dashboard/overview", { params });
      if (requestId !== requestIdRef.current) return; // a newer request is in flight
      setApiData(response.data.data);
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      const msg = error?.response?.data?.message || "Failed to fetch dashboard data";
      setApiError(msg);
      toast.error(msg);
    } finally {
      if (requestId === requestIdRef.current) setApiLoading(false);
    }
  }, [
    dateRange,
    selectedCircle,
    selectedDivision,
    selectedSubDivision,
    statusFilter,
    typeFilter,
    debouncedSearch,
    page,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Map API data to UI structures ── */
  const filterOptions = useMemo<FilterOptions | null>(() => apiData?.filter_options ?? null, [apiData]);

  const filteredRows: PtwRow[] = useMemo(() => {
    if (!apiData?.live_ptw_requests?.data) return [];
    return apiData.live_ptw_requests.data.map((r) => ({
      id:  String(r.id) || "",
      ptw_code: r.ptw_code || "",
      feeder: r.feeder,
      type: (r.type.toLowerCase().charAt(0).toUpperCase() + r.type.toLowerCase().slice(1)) as "Planned" | "Emergency" | "Misc",
      status: r.status,
       division: r.division || "",    
      circle: r.circle,
     
      subDivision: r.sub_division,
      lsName: r.ls,
      start: r.due_time || "",
      evidenceCompletion: 0, // Per-PTW evidence is not provided by the API
      rolesPath: "",
    }));
  }, [apiData]);

  const stats = useMemo(() => {
    const evidence = apiData?.analytics_overview?.evidence_stats;
    return {
      active: apiData?.summary?.active_ptws ?? 0,
      issued: apiData?.summary?.issued ?? 0,
      issuedEver: apiData?.summary?.issued_ever,
      closed: apiData?.summary?.closed ?? 0,
      total: apiData?.summary?.total_filtered ?? 0,
      evidenceCoverage: (evidence?.coverage_percent ?? 0) / 100,
      withEvidence: evidence?.with_evidence ?? 0,
      withoutEvidence: evidence?.without_evidence ?? 0,
    };
  }, [apiData]);

  // Days after today have no data yet – leave them blank instead of dropping the line to 0
  const trendData = useMemo(() => {
    if (!apiData?.ptw_volume_trend) return [];
    const todayISO = toLocalISODate(new Date());
    return apiData.ptw_volume_trend.labels.map((label, i) => ({
      date: formatTrendLabel(label),
      count: label > todayISO ? null : apiData.ptw_volume_trend.values[i] ?? 0,
    }));
  }, [apiData]);

  // Uses the new ptw_statistics (circle / division / sub_division level); falls back to circle_wise_stats
  const statsRows = useMemo(() => {
    if (!apiData) return [];
    if (apiData.ptw_statistics?.length) {
      return apiData.ptw_statistics.map((s) => ({
        name: s.name,
        active: s.active,
        closed: s.closed,
        cancelled: s.cancelled,
        total: s.total,
      }));
    }
    return (apiData.circle_wise_stats ?? []).map((s) => ({
      name: s.circle,
      active: s.active,
      closed: s.closed,
      cancelled: 0,
      total: s.total,
    }));
  }, [apiData]);

  const statsTitle = useMemo(() => {
    const level = apiData?.ptw_statistics?.[0]?.level ?? "circle";
    return `${LEVEL_LABELS[level] ?? "Circle"}-wise PTW Statistics`;
  }, [apiData]);

  const typeSplit = useMemo(() => {
    if (!apiData?.analytics_overview?.type_distribution) return { Planned: 0, Emergency: 0, Misc: 0 };
    const dist = apiData.analytics_overview.type_distribution;
    const result = { Planned: 0, Emergency: 0, Misc: 0 };
    dist.forEach((d) => {
      const key = d.type.toLowerCase().charAt(0).toUpperCase() + d.type.toLowerCase().slice(1);
      if (key in result) result[key as keyof typeof result] = d.count;
    });
    return result;
  }, [apiData]);

  const actionQueue = useMemo(() => apiData?.action_queue || [], [apiData]);
  const recentActivity = useMemo(() => apiData?.recent_activity || [], [apiData]);

const BRAND_RED = "FFED1F27";
const ZEBRA = "FFFDF2F2";
const BORDER = "FFE5E7EB";

const exportExcel = useCallback(async () => {
  if (isExporting) return;
  setIsExporting(true);

  try {
    const params: Record<string, string | number> = {
      from: toLocalISODate(dateRange.from),
      to: toLocalISODate(dateRange.to),
      export: 1,
      per_page: "all",
    };
    if (selectedCircle !== "ALL") params.circle_id = selectedCircle;
    if (selectedDivision !== "ALL") params.division_id = selectedDivision;
    if (selectedSubDivision !== "ALL")
      params.sub_division_id = selectedSubDivision;
    if (statusFilter.length === 1) params.status = statusFilter[0];
    if (typeFilter !== "ALL") params.type = typeFilter.toUpperCase();
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

    const response = await api.get<ApiResponse>(
      "/api/v1/meta/dashboard/overview",
      { params },
    );

    const allRows = response.data.data.live_ptw_requests?.data ?? [];

    if (allRows.length === 0) {
      toast.info("No records match the current filters.");
      return;
    }

    // Lazy-load so it doesn't hit the main bundle
    const ExcelJS = (await import("exceljs")).default;

    const wb = new ExcelJS.Workbook();
    wb.creator = "PTW Dashboard";
    wb.created = new Date();

    const ws = wb.addWorksheet("PTW Requests", {
      views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    const headers = [
      "Sr",
      "PTW ID",
      "Feeder",
      "Type",
      "Status",
      "Circle",
      "Division",
      "Sub Division",
      "LS",
      "Due Time",
    ];
    const colCount = headers.length;

    const body = allRows.map((r, idx) => [
      idx + 1,
      r.ptw_code ?? String(r.id),
      r.feeder ?? "",
      r.type ?? "",
      r.status ?? "",
      r.circle ?? "",
      r.division ?? "",
      r.sub_division ?? "",
      r.ls ?? "",
      r.due_time ?? "",
    ]);

    // ── Title banner ──────────────────────────────────────────
    ws.mergeCells(1, 1, 1, colCount);
    const title = ws.getCell(1, 1);
    title.value = "PTW Requests Report";
    title.font = { name: "Calibri", size: 18, bold: true, color: { argb: BRAND_RED } };
    title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(1).height = 32;

    ws.mergeCells(2, 1, 2, colCount);
    const sub = ws.getCell(2, 1);
    sub.value = `Period: ${params.from} → ${params.to}   |   Records: ${allRows.length}   |   Generated: ${new Date().toLocaleString()}`;
    sub.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF6B7280" } };
    sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(2).height = 20;

    ws.getRow(3).height = 8; // spacer

    // ── Header row (row 4) ────────────────────────────────────
    const headerRow = ws.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_RED } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: BRAND_RED } },
        bottom: { style: "medium", color: { argb: "FFB3141A" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    });
    headerRow.height = 28;

    // ── Body rows ─────────────────────────────────────────────
    const centerCols = new Set([0, 3, 4, 8, 9]); // Sr, Type, Status, LS, Due Time

    body.forEach((row, rIdx) => {
      const excelRow = ws.getRow(5 + rIdx);
      row.forEach((val, cIdx) => {
        const cell = excelRow.getCell(cIdx + 1);
        cell.value = val as ExcelJS.CellValue;
        cell.font = { name: "Calibri", size: 10.5, color: { argb: "FF1F2937" } };
        cell.alignment = {
          vertical: "middle",
          horizontal: centerCols.has(cIdx) ? "center" : "left",
          indent: centerCols.has(cIdx) ? 0 : 1,
          wrapText: false,
        };
        cell.border = {
          bottom: { style: "thin", color: { argb: BORDER } },
          left: { style: "thin", color: { argb: BORDER } },
          right: { style: "thin", color: { argb: BORDER } },
        };
        if (rIdx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
        }
      });
      excelRow.height = 22;
    });

    // ── Auto column widths ────────────────────────────────────
    headers.forEach((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...body.map((r) => String(r[i] ?? "").length),
      );
      ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 10), 40);
    });
    ws.getColumn(1).width = 8; // Sr stays narrow

    // Filter dropdowns on header row
    ws.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + body.length, column: colCount },
    };

    // ── Download ──────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PTW_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      `Exported ${allRows.length} PTW record${allRows.length !== 1 ? "s" : ""}`,
    );
  } catch (error: any) {
    toast.error(error?.response?.data?.message ?? "Failed to export data");
  } finally {
    setIsExporting(false);
  }
}, [
  isExporting,
  dateRange,
  selectedCircle,
  selectedDivision,
  selectedSubDivision,
  statusFilter,
  typeFilter,
  debouncedSearch,
]);

  const [selectedPtw, setSelectedPtw] = useState<PtwRow | null>(null);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-700">
      {/* Top progress bar – visible during every request */}
      <AnimatePresence>{apiLoading && <TopProgressBar />}</AnimatePresence>

      <main className="px-3 py-3 sm:px-4 lg:px-6">
        <DashboardToolbar
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          dateRangeLabel={dateRangeLabel}
          filterOptions={filterOptions}
          selectedCircle={selectedCircle}
          onCircleChange={handleCircleChange}
          selectedDivision={selectedDivision}
          onDivisionChange={handleDivisionChange}
          selectedSubDivision={selectedSubDivision}
          onSubDivisionChange={handleSubDivisionChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          isLoading={apiLoading}
          onRefresh={fetchData}
          exportCSV={exportExcel}
           
        />

        {/* First load / first error (no data to show yet) */}
        {!apiData ? (
          apiError && !apiLoading ? (
            <ErrorState message={apiError} onRetry={fetchData} />
          ) : (
            <PageLoader />
          )
        ) : (
          <div className="relative mt-3 space-y-3">
            {/* Overlay while refreshing after filter / page / date changes */}
            <AnimatePresence>{apiLoading && <LoadingOverlay key="loading-overlay" />}</AnimatePresence>

            {/* Metric Cards */}
            <motion.section initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <motion.div variants={fade} custom={0}><MetricCard label="Active PTWs" value={stats.active} helper="Draft · Submitted · Issued · In Execution" tone="green" icon="ClipboardCheck" /></motion.div>
              <motion.div variants={fade} custom={0.05}>
                <MetricCard
                  label="Issued"
                  value={stats.issued}
                  helper={stats.issuedEver !== undefined ? `Currently issued · ${formatNumber(stats.issuedEver)} ever` : "PTW Issued"}
                  tone="amber"
                  icon="BadgeCheck"
                />
              </motion.div>
              <motion.div variants={fade} custom={0.1}><MetricCard label="Closed" value={stats.closed} helper="Grid Restored & Closed" tone="blue" icon="ShieldCheck" /></motion.div>
              <motion.div variants={fade} custom={0.15}><MetricCard label="Total (Filtered)" value={stats.total} helper="Current filter scope" tone="red" icon="ListFilter" /></motion.div>
            </motion.section>

            {/* Charts Row */}
            <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Card className="min-w-0 p-4">
                <SectionHeader title="PTW Volume Trend" />
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1684F8" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#1684F8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#E8EDF4" strokeDasharray="2 3" />
                    <XAxis dataKey="date" tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={18} />
                    <YAxis allowDecimals={false} tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<TooltipBox />} />
                    <Area type="monotone" dataKey="count" name="PTWs" stroke="#1684F8" strokeWidth={2.5} fill="url(#trendFill)" connectNulls={false} dot={{ r: 3, fill: "#1684F8", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="min-w-0 p-4">
                <SectionHeader title={statsTitle} />
                {/* Scrolls sideways on very small screens instead of squeezing the bars */}
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={statsRows} barCategoryGap="30%">
                        <CartesianGrid vertical={false} stroke="#E8EDF4" strokeDasharray="2 3" />
                        <XAxis dataKey="name" tick={{ fill: "#718096", fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis allowDecimals={false} tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip content={<TooltipBox />} />
                        <Legend wrapperStyle={{ fontSize: 10, color: "#718096" }} />
                        <Bar dataKey="active" name="Active" fill="#F4A000" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="closed" name="Closed" fill="#13B76A" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="cancelled" name="Cancelled" fill="#F0445A" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="total" name="Total" fill="#1684F8" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </section>

            {/* Merged Analytics Card */}
            <section>
              <AnalyticsCard
                split={typeSplit}
                evidenceValue={stats.evidenceCoverage}
                withEvidence={stats.withEvidence}
                withoutEvidence={stats.withoutEvidence}
              />
            </section>

            {/* Table + Side Panels */}
            <section className="grid grid-cols-1 gap-3 ">
              <div className="min-w-0">
                <LivePtwTable
                  rows={filteredRows}
                  totalResults={apiData?.live_ptw_requests?.total || 0}
                  currentPage={apiData?.live_ptw_requests?.current_page || 1}
                  totalPages={apiData?.live_ptw_requests?.last_page || 1}
                  onPageChange={setPage}
                  search={search}
                  setSearch={setSearch}
                  typeFilter={typeFilter}
                  setTypeFilter={handleTypeChange}
                  typeCounts={apiData?.live_ptw_requests?.counts_by_type}
                  onSelect={setSelectedPtw}
                  exportCSV={exportExcel}
                    isExporting={isExporting}
                />
              </div>
            </section>
              <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2  xl:content-start">
                <ActionQueue items={actionQueue} />
                <RecentActivity items={recentActivity} />
              </div>
          </div>
        )}
      </main>

      {/* PTW Detail Modal */}
      <AnimatePresence>
        {selectedPtw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-3 backdrop-blur-[2px] sm:p-4"
            onClick={() => setSelectedPtw(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-[#1684F8]">{selectedPtw.id}</div>
                  <h3 className="mt-1 text-lg font-semibold text-[#10213C]">Permit to Work</h3>
                </div>
                <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSelectedPtw(null)}>
                  <Lucide icon="X" className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Feeder</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.feeder}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Type</div>
                  <div className="mt-1"><TypeBadge type={selectedPtw.type} /></div>
                </div>
               <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
  <div className="text-slate-400">Location</div>
  <div className="mt-1 grid grid-cols-3 gap-2 text-slate-700">
    <div>
      <div className="text-[9px] uppercase text-slate-400">Circle</div>
      <div className="font-semibold">{selectedPtw.circle}</div>
    </div>
    <div>
      <div className="text-[9px] uppercase text-slate-400">Division</div>
      <div className="font-semibold">{selectedPtw.division || "—"}</div>
    </div>
    <div>
      <div className="text-[9px] uppercase text-slate-400">Sub Division</div>
      <div className="font-semibold">{selectedPtw.subDivision || "—"}</div>
    </div>
  </div>
</div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Status</div>
                  <div className="mt-1"><StatusBadge status={selectedPtw.status} /></div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">LS Name</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.lsName}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Evidence</div>
                  <div className="mt-1 font-semibold text-slate-700">{Math.round(selectedPtw.evidenceCompletion * 100)}%</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                  <div className="text-slate-400">Due Date</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.start ? new Date(selectedPtw.start).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                  <div className="text-slate-400">Workflow Path</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.rolesPath || "—"}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="primary" className="flex-1 rounded-lg bg-[#0B69DC] text-xs" onClick={() => { navigate(`/ptw/${selectedPtw.id}`); setSelectedPtw(null); }}>View Full Workflow</Button>
                <Button variant="outline-secondary" className="rounded-lg text-xs" onClick={() => setSelectedPtw(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}