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

// Types for hierarchical filters
type SubDivision = { id: string; name: string };
type Division = { id: string; name: string; subdivisions: SubDivision[] };
type Circle = { id: string; name: string; divisions: Division[] };

// Static circles (with IDs) used for filters – adjust as needed
const CIRCLES: Circle[] = [
  {
    id: "1",
    name: "Multan",
    divisions: [
      {
        id: "1",
        name: "Multan Division",
        subdivisions: [
          { id: "1", name: "Multan Cantt" },
          { id: "2", name: "Shujabad" },
        ],
      },
      {
        id: "2",
        name: "Khanewal Division",
        subdivisions: [
          { id: "3", name: "Khanewal" },
          { id: "4", name: "Mian Channu" },
        ],
      },
    ],
  },
  { id: "2", name: "D.g. khan", divisions: [] },
  { id: "3", name: "Vehari", divisions: [] },
  { id: "4", name: "Bahawalpur", divisions: [] },
  { id: "5", name: "Sahiwal", divisions: [] },
  { id: "6", name: "Rahim yar khan", divisions: [] },
  { id: "7", name: "Muzaffargarh", divisions: [] },
  { id: "8", name: "Bahawal nagar", divisions: [] },
  { id: "9", name: "Khanewal", divisions: [] },
];

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

const formatStatus = (status: PtwStatus) =>
  status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

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
      className="flex h-14 w-14 items-center justify-center rounded-full"
      style={{ backgroundColor: s.bg }}
    >
      <Lucide icon={icon} className="h-6 w-6" style={{ color: s.fg }} />
    </div>
  );
};

const SectionHeader: React.FC<{
  title: string;
  right?: React.ReactNode;
}> = ({ title, right }) => (
  <div className="mb-3 flex items-center justify-between">
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
      className="inline-flex rounded-md border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.02em]"
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
            <span className="ml-auto font-semibold text-slate-800">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   SELECT CONTROL (unchanged)
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 min-w-[130px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left shadow-sm transition-all duration-150",
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
            className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 min-w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70"
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
   ═══════════════════════════════════════════════ */
const DashboardToolbar: React.FC<{
  timeRange: string;
  setTimeRange: (v: any) => void;
  selectedCircle: string;
  setSelectedCircle: (v: string) => void;
  selectedDivision: string;
  setSelectedDivision: (v: string) => void;
  selectedSubDivision: string;
  setSelectedSubDivision: (v: string) => void;
  statusFilter: PtwStatus[];
  setStatusFilter: (v: PtwStatus[]) => void;
  availableDivisions: Division[];
  availableSubDivisions: SubDivision[];
  exportCSV: () => void;
}> = ({
  timeRange, setTimeRange, selectedCircle, setSelectedCircle,
  selectedDivision, setSelectedDivision, selectedSubDivision,
  setSelectedSubDivision, statusFilter, setStatusFilter,
  availableDivisions, availableSubDivisions, exportCSV,
}) => {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
            <Lucide icon="ShieldCheck" className="h-5 w-5 text-[#1684F8]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-semibold leading-tight tracking-[-0.02em] text-[#10213C]">
              E-Safety (PTW) Dashboard
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live grid monitoring, approvals & compliance
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectControl icon="CalendarDays" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </SelectControl>

          <SelectControl
            value={selectedCircle}
            onChange={(e) => { setSelectedCircle(e.target.value); setSelectedDivision("ALL"); setSelectedSubDivision("ALL"); }}
          >
            <option value="ALL">All Circles</option>
            {CIRCLES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectControl>

          <SelectControl
            value={selectedDivision}
            disabled={selectedCircle === "ALL"}
            onChange={(e) => { setSelectedDivision(e.target.value); setSelectedSubDivision("ALL"); }}
          >
            <option value="ALL">All Divisions</option>
            {availableDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectControl>

          <SelectControl
            value={selectedSubDivision}
            disabled={selectedDivision === "ALL"}
            onChange={(e) => setSelectedSubDivision(e.target.value)}
          >
            <option value="ALL">All Sub Divisions</option>
            {availableSubDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectControl>

          <SelectControl
            value={statusFilter[0] ?? "ALL"}
            onChange={(e) => setStatusFilter(e.target.value === "ALL" ? [] : [e.target.value as PtwStatus])}
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_COLORS).map((status) => (
              <option value={status} key={status}>{status.replace(/_/g, " ")}</option>
            ))}
          </SelectControl>

          <div className="mx-1 h-6 w-px bg-slate-200" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700"
          >
            <Lucide icon="RefreshCw" className="h-4 w-4" />
          </motion.button>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button
              variant="primary"
              onClick={exportCSV}
              className="h-9 rounded-lg bg-[#0B69DC] px-3 text-xs font-medium shadow-[0_8px_18px_rgba(11,105,220,.18)]"
            >
              <Lucide icon="Download" className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </motion.div>
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
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{label}</div>
          <div className="mt-1 text-[28px] font-semibold leading-none text-[#10213C]">{value}</div>
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
   ANALYTICS CARD — Merged Type Split + Evidence
   ═══════════════════════════════════════════════ */
const AnalyticsCard: React.FC<{
  split: { Planned: number; Emergency: number; Misc: number };
  evidenceValue: number;
}> = ({ split, evidenceValue }) => {
  const total = split.Planned + split.Emergency + split.Misc || 1;
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

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50">
            <Lucide icon="BarChart3" className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold tracking-[-0.01em] text-[#10213C]">Analytics Overview</h2>
            <p className="text-[10px] text-slate-400">Type distribution & evidence completion</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tabular-nums text-slate-500">
          {total} permits
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
                <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">Avg</span>
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

          <div className="mt-3 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Lucide icon="Target" className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-500">Target <span className="font-bold text-slate-700">100%</span></span>
            </div>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: strokeColor }}>{100 - pct}% left</span>
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
            centerValue={String(total)}
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
                <span className="text-[10px] font-bold tabular-nums text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom summary */}
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
        <Lucide icon="PieChart" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="text-[10px] text-slate-500">
          <span className="font-bold" style={{ color: "#1684F8" }}>Planned</span> leads at{" "}
          <span className="font-bold" style={{ color: "#1684F8" }}>{Math.round((split.Planned / total) * 100)}%</span>
          {" · "}
          <span className="font-bold" style={{ color: "#F0445A" }}>Emergency</span> at{" "}
          <span className="font-bold" style={{ color: "#F0445A" }}>{Math.round((split.Emergency / total) * 100)}%</span>
          {" · "}
          <span className="font-bold" style={{ color: strokeColor }}>Evidence</span>{" "}
          <span className="font-bold" style={{ color: strokeColor }}>{pct}%</span>
        </span>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   LIVE PTW TABLE (now with external pagination)
   ═══════════════════════════════════════════════ */
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
  onSelect: (row: PtwRow) => void;
  exportCSV: () => void;
}> = ({ rows, totalResults, currentPage, totalPages, onPageChange, search, setSearch, typeFilter, setTypeFilter, onSelect, exportCSV }) => {
  const PER_PAGE = 8;
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

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
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
            <div className="relative">
              <Lucide icon="Search" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, feeder, LS..."
                className="h-9 w-[210px] rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-8 text-[11px] text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                  <Lucide icon="X" className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200" />

            <Button variant="outline-secondary" onClick={exportCSV} className="h-9 rounded-lg px-3 text-[11px]">
              <Lucide icon="Download" className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          {typeOptions.map((t) => {
            const active = typeFilter === t;
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
              </button>
            );
          })}
          <div className="ml-auto text-[10px] tabular-nums text-slate-400">{totalResults} result{totalResults !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[940px] w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="w-12 px-3 py-3 text-center text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Sr</th>
              <th className="px-4 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">PTW ID</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Feeder</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Type</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Status</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Circle / Division</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">LS</th>
              <th className="w-[130px] px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Evidence</th>
              <th className="px-3 py-3 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">Due In</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="flex flex-col items-center gap-3 py-20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <Lucide icon="SearchX" className="h-6 w-6 text-slate-300" />
                    </div>
                    <div className="text-[13px] font-semibold text-slate-500">No results found</div>
                    <div className="text-[11px] text-slate-400">Try adjusting your search or filter criteria</div>
                    {search && (
                      <button onClick={() => setSearch("")} className="mt-1 rounded-lg bg-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200">
                        Clear search
                      </button>
                    )}
                  </div>
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
                          {r.id}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">{r.feeder}</td>
                      <td className="px-3 py-3"><TypeBadge type={r.type} /></td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-700">{r.circle}</div>
                        <div className="mt-0.5 text-[9px] text-slate-400">{r.division} · {r.subDivision}</div>
                      </td>
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
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
          <div className="text-[10px] text-slate-400">
            Showing <span className="font-semibold text-slate-600">{srStart}–{srEnd}</span> of{" "}
            <span className="font-semibold text-slate-600">{totalResults}</span> entries
          </div>
          <div className="flex items-center gap-1">
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
   ACTION QUEUE (now receives data)
   ═══════════════════════════════════════════════ */
const ActionQueue: React.FC<{ items: any[] }> = ({ items }) => {
  return (
    <Card className="p-3.5">
      <SectionHeader title="My Action Queue" right={<button className="text-[10px] font-medium text-[#0B69DC]">View All</button>} />
      <div className="space-y-1.5">
        {items.slice(0, 4).map((item, index) => {
          const isOverdue = item.is_overdue;
          const icon: IconName = isOverdue ? "AlertCircle" : "Clock";
          const iconStyle = isOverdue ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500";
          const badgeStyle = isOverdue ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500";
          return (
            <div key={index} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2">
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", iconStyle)}>
                <Lucide icon={icon} className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-semibold text-slate-700">{item.ptw_code}</div>
                <div className="truncate text-[9px] text-slate-500">{item.pending_with}</div>
              </div>
              <span className={cn("shrink-0 rounded-md px-2 py-1 text-[9px] font-medium", badgeStyle)}>
                {isOverdue ? "Overdue" : "Due"}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   RECENT ACTIVITY (now receives data)
   ═══════════════════════════════════════════════ */
const RecentActivity: React.FC<{ items: any[] }> = ({ items }) => {
  return (
    <Card className="p-3.5">
      <SectionHeader title="Recent PTW Activity" right={<span className="text-[9px] text-slate-400">Last 24 hours</span>} />
      <div className="relative space-y-2.5 pl-4">
        <div className="absolute bottom-2 left-[5px] top-2 w-px bg-blue-100" />
        {items.slice(0, 4).map((item, index) => (
          <div key={index} className="relative flex gap-2">
            <span className="absolute -left-[15px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#1684F8] shadow-[0_0_0_2px_rgba(22,132,248,.16)]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-semibold text-slate-700">{item.actor}</span>
                <span className="shrink-0 text-[8px] text-slate-400">{item.time}</span>
              </div>
              <div className="text-[9px] leading-4 text-slate-500">
                {item.action} {item.notes ? `- ${item.notes}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════ */

type PtwRow = {
  id: string;
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
    summary: {
      active_ptws: number;
      issued: number;
      closed: number;
      total_filtered: number;
    };
    ptw_volume_trend: {
      labels: string[];
      values: number[];
    };
    circle_wise_stats: {
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
    };
    live_ptw_requests: {
      data: {
        id: number;
        ptw_code: string | null;
        feeder: string;
        type: string;
        status: PtwStatus;
        circle: string;
        sub_division: string;
        ls: string;
        due_time: string | null;
      }[];
      current_page: number;
      last_page: number;
      total: number;
    };
    action_queue: {
      ptw_code: string;
      type: string;
      status: PtwStatus;
      pending_with: string;
      due_time: string;
      is_overdue: boolean;
    }[];
    recent_activity: {
      actor: string;
      action: string;
      notes: string | null;
      time: string;
    }[];
  };
};

export default function EsafetyDashboard() {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("week");
  const [selectedCircle, setSelectedCircle] = useState("ALL");
  const [selectedDivision, setSelectedDivision] = useState("ALL");
  const [selectedSubDivision, setSelectedSubDivision] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<PtwStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse["data"] | null>(null);

  const getDateRange = useCallback((): { from: string; to: string } => {
    const now = new Date();
    const format = (d: Date) => d.toISOString().slice(0, 10);
    if (timeRange === "today") {
      return { from: format(now), to: format(now) };
    }
    if (timeRange === "week") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { from: format(from), to: format(now) };
    }
    // month
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    return { from: format(from), to: format(now) };
  }, [timeRange]);

  const fetchData = useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const { from, to } = getDateRange();
      const params: Record<string, string | number> = {
        from,
        to,
        page,
        per_page: 8,
      };
      if (selectedCircle !== "ALL") params.circle_id = selectedCircle;
      if (selectedDivision !== "ALL") params.division_id = selectedDivision;
      if (selectedSubDivision !== "ALL") params.sub_division_id = selectedSubDivision;
      if (statusFilter.length === 1) params.status = statusFilter[0];
      if (typeFilter !== "ALL") params.type = typeFilter.toUpperCase();
      if (search.trim()) params.search = search.trim();

      const response = await api.get<ApiResponse>("/api/v1/meta/dashboard/overview", { params });
      setApiData(response.data.data);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to fetch dashboard data";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setApiLoading(false);
    }
  }, [timeRange, selectedCircle, selectedDivision, selectedSubDivision, statusFilter, typeFilter, search, page, getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map API data to UI structures
  const filteredRows: PtwRow[] = useMemo(() => {
    if (!apiData?.live_ptw_requests?.data) return [];
    return apiData.live_ptw_requests.data.map((r) => ({
      id: r.ptw_code || String(r.id),
      feeder: r.feeder,
      type: r.type.toLowerCase().charAt(0).toUpperCase() + r.type.toLowerCase().slice(1) as "Planned" | "Emergency" | "Misc",
      status: r.status,
      circle: r.circle,
      division: "", // Not provided, could be derived if needed
      subDivision: r.sub_division,
      lsName: r.ls,
      start: r.due_time || "",
      evidenceCompletion: 0, // Not provided
      rolesPath: "",
    }));
  }, [apiData]);

  const stats = useMemo(() => {
    if (!apiData?.summary) return { active: 0, issued: 0, closed: 0, total: 0, avg_evidence: 0 };
    return {
      active: apiData.summary.active_ptws,
      issued: apiData.summary.issued,
      closed: apiData.summary.closed,
      total: apiData.summary.total_filtered,
      avg_evidence: 0, // Not provided
    };
  }, [apiData]);

  const trendData = useMemo(() => {
    if (!apiData?.ptw_volume_trend) return [];
    return apiData.ptw_volume_trend.labels.map((label, i) => ({
      date: label,
      count: apiData.ptw_volume_trend.values[i] || 0,
    }));
  }, [apiData]);

  const circleStats = useMemo(() => apiData?.circle_wise_stats || [], [apiData]);

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

  // Division / Sub-division options
  const availableDivisions = useMemo(() => {
    if (selectedCircle === "ALL") return [] as Division[];
    const circle = CIRCLES.find((c) => c.id === selectedCircle);
    return circle?.divisions || [];
  }, [selectedCircle]);

  const availableSubDivisions = useMemo(() => {
    if (selectedDivision === "ALL") return [] as SubDivision[];
    const circle = CIRCLES.find((c) => c.id === selectedCircle);
    const division = circle?.divisions.find((d) => d.id === selectedDivision);
    return division?.subdivisions || [];
  }, [selectedCircle, selectedDivision]);

  const exportCSV = () => {
    const headers = ["PTW ID", "Feeder", "Type", "Status", "Circle", "Sub Division", "LS", "Due Time"];
    const body = filteredRows.map((r) => [
      r.id,
      r.feeder,
      r.type,
      r.status,
      r.circle,
      r.subDivision,
      r.lsName,
      r.start,
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PTW_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [selectedPtw, setSelectedPtw] = useState<PtwRow | null>(null);

  if (apiLoading && !apiData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (apiError && !apiData) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {apiError}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-700">
      <main className="px-3 py-3 sm:px-4 lg:px-6">
        <DashboardToolbar
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          selectedCircle={selectedCircle}
          setSelectedCircle={setSelectedCircle}
          selectedDivision={selectedDivision}
          setSelectedDivision={setSelectedDivision}
          selectedSubDivision={selectedSubDivision}
          setSelectedSubDivision={setSelectedSubDivision}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          availableDivisions={availableDivisions}
          availableSubDivisions={availableSubDivisions}
          exportCSV={exportCSV}
        />

        {/* Metric Cards */}
        <motion.section initial="hidden" animate="show" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <motion.div variants={fade} custom={0}><MetricCard label="Active PTWs" value={stats.active} helper="Draft · Submitted · Issued · In Execution" tone="green" icon="ClipboardCheck" /></motion.div>
          <motion.div variants={fade} custom={0.05}><MetricCard label="Issued" value={stats.issued} helper="PTW Issued" tone="amber" icon="BadgeCheck" /></motion.div>
          <motion.div variants={fade} custom={0.1}><MetricCard label="Closed" value={stats.closed} helper="Grid Restored & Closed" tone="blue" icon="ShieldCheck" /></motion.div>
          <motion.div variants={fade} custom={0.15}><MetricCard label="Total (Filtered)" value={stats.total} helper="Current filter scope" tone="red" icon="ListFilter" /></motion.div>
        </motion.section>

        {/* Charts Row */}
        <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Card className="p-4">
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
                <XAxis dataKey="date" tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Area type="monotone" dataKey="count" name="PTWs" stroke="#1684F8" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: "#1684F8", strokeWidth: 0 }} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Circle-wise PTW Statistics" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={circleStats} barCategoryGap="38%">
                <CartesianGrid vertical={false} stroke="#E8EDF4" strokeDasharray="2 3" />
                <XAxis dataKey="circle" tick={{ fill: "#718096", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#718096" }} />
                <Bar dataKey="active" name="Active" fill="#F4A000" radius={[3, 3, 0, 0]} />
                <Bar dataKey="closed" name="Closed" fill="#13B76A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#1684F8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Merged Analytics Card */}
        <section className="mt-3">
          <AnalyticsCard split={typeSplit} evidenceValue={stats.avg_evidence} />
        </section>

        {/* Table + Side Panels */}
        <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr]">
          <LivePtwTable
            rows={filteredRows}
            totalResults={apiData?.live_ptw_requests?.total || 0}
            currentPage={apiData?.live_ptw_requests?.current_page || 1}
            totalPages={apiData?.live_ptw_requests?.last_page || 1}
            onPageChange={setPage}
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onSelect={setSelectedPtw}
            exportCSV={exportCSV}
          />
          <div className="space-y-3">
            <ActionQueue items={actionQueue} />
            <RecentActivity items={recentActivity} />
          </div>
        </section>
      </main>

      {/* PTW Detail Modal */}
      <AnimatePresence>
        {selectedPtw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
            onClick={() => setSelectedPtw(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1684F8]">{selectedPtw.id}</div>
                  <h3 className="mt-1 text-lg font-semibold text-[#10213C]">Permit to Work</h3>
                </div>
                <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSelectedPtw(null)}>
                  <Lucide icon="X" className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Feeder</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.feeder}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Type</div>
                  <div className="mt-1"><TypeBadge type={selectedPtw.type} /></div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Circle / Division</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.circle}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">{selectedPtw.division} · {selectedPtw.subDivision}</div>
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
                <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Due Date</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.start ? new Date(selectedPtw.start).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
                </div>
                <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-400">Workflow Path</div>
                  <div className="mt-1 font-semibold text-slate-700">{selectedPtw.rolesPath || "—"}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="primary" className="flex-1 rounded-lg bg-[#0B69DC] text-xs">View Full Workflow</Button>
                <Button variant="outline-secondary" className="rounded-lg text-xs" onClick={() => setSelectedPtw(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}