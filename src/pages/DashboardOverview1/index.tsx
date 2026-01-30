"use client";

import React, { useMemo, useState } from "react";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";


const colors = {
  blue: "#0A3AA9",
  navy: "#0B1D4D",
  orange: "#E95420",
  bg: "#F5F7FA",
};
const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");
type PtwStatus = "Issued" | "Ready" | "In-Progress" | "Closed" | "Rejected";
type PtwType = "Planned" | "Emergency" | "Forced";
interface PtwRow {
  id: string;
  feeder: string;
  type: PtwType;
  status: PtwStatus;
  risk: "Low" | "Medium" | "High";
  circle: string;
  division: string;
  subDivision: string;
  start: string;
  lsName: string;
  rolesPath: string;
  evidenceCompletion: number; // 0..1
}
const STATUS_COLORS: Record<PtwStatus, string> = {
  Issued: "bg-blue-600",
  Ready: "bg-teal-600",
  "In-Progress": "bg-indigo-600",
  Closed: "bg-emerald-600",
  Rejected: "bg-rose-600",
};
const PTW_ROWS: PtwRow[] = [
  {
    id: "PTW-000812",
    feeder: "FE-12-MLT",
    type: "Planned",
    status: "Ready",
    risk: "Medium",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Cantt Sub-Div",
    start: "2025-10-21 10:00",
    lsName: "Ali Raza",
    rolesPath: "LS → SDO → XEN → SE → Grid → Inspector",
    evidenceCompletion: 0.75,
  },
  {
    id: "PTW-000769",
    feeder: "FE-07-BWP",
    type: "Emergency",
    status: "In-Progress",
    risk: "High",
    circle: "Bahawalpur Circle",
    division: "Bahawalpur Urban",
    subDivision: "Model Town",
    start: "2025-10-21 08:20",
    lsName: "Usman Khan",
    rolesPath: "LS → SDO → Grid → Inspector",
    evidenceCompletion: 0.95,
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "Issued",
    risk: "Low",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
    start: "2025-10-22 09:00",
    lsName: "Imran Shah",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 0.4,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Forced",
    status: "Closed",
    risk: "High",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
    start: "2025-10-20 14:30",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "Issued",
    risk: "Low",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
    start: "2025-10-22 09:00",
    lsName: "Imran Shah",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 0.4,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Forced",
    status: "Closed",
    risk: "High",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
    start: "2025-10-20 14:30",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "Issued",
    risk: "Low",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
    start: "2025-10-22 09:00",
    lsName: "Imran Shah",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 0.4,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Forced",
    status: "Closed",
    risk: "High",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
    start: "2025-10-20 14:30",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "Issued",
    risk: "Low",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
    start: "2025-10-22 09:00",
    lsName: "Imran Shah",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 0.4,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Forced",
    status: "Closed",
    risk: "High",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
    start: "2025-10-20 14:30",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "Issued",
    risk: "Low",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
    start: "2025-10-22 09:00",
    lsName: "Imran Shah",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 0.4,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Forced",
    status: "Closed",
    risk: "High",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
    start: "2025-10-20 14:30",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Forced",
    status: "Closed",
    risk: "High",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
    start: "2025-10-20 14:30",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
];
const CIRCLES = [
  { name: "Multan Circle", spt: 0.86, activePtws: 21 },
  { name: "Bahawalpur Circle", spt: 0.73, activePtws: 15 },
  { name: "D.G. Khan Circle", spt: 0.92, activePtws: 9 },
];
const ACTION_QUEUE = [
  {
    who: "SDO Multan",
    role: "SDO",
    item: "Approve PTW-000812 (Planned)",
    badge: "Due in 45 min",
    tone: "warn" as const,
  },
  {
    who: "XEN DGK",
    role: "XEN",
    item: "Technical review for PTW-000655",
    badge: "Today",
    tone: "info" as const,
  },
  {
    who: "PDC BWP",
    role: "PDC",
    item: "Feeder conflict check for PTW-000769",
    badge: "Overdue",
    tone: "bad" as const,
  },
  {
    who: "Inspector Multan",
    role: "Safety Inspector",
    item: "SPT checklist verification (3 jobs)",
    badge: "Pending",
    tone: "info" as const,
  },
  {
    who: "PDC BWP",
    role: "PDC",
    item: "Feeder conflict check for PTW-000769",
    badge: "Overdue",
    tone: "bad" as const,
  },
  {
    who: "Inspector Multan",
    role: "Safety Inspector",
    item: "SPT checklist verification (3 jobs)",
    badge: "Pending",
    tone: "info" as const,
  },
];
const TIMELINE = [
  { who: "LS Multan", time: "09:05", text: "Created PTW-000812 with site photos." },
  { who: "SDO BWP", time: "09:18", text: "Returned PTW-000769 for hazard details." },
  { who: "XEN DGK", time: "09:40", text: "Forwarded PTW-000655 to PDC." },
  { who: "Grid BWP", time: "10:10", text: "Completed rack-out for FE-07-BWP." },
];
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
    {children}
  </div>
);
const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: "ok" | "warn" | "bad";
}> = ({ label, value, subtitle, tone }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
        {subtitle && (
          <div
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              tone === "ok" && "bg-emerald-50 text-emerald-700",
              tone === "warn" && "bg-amber-50 text-amber-700",
              tone === "bad" && "bg-rose-50 text-rose-700"
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div className="rounded-xl bg-slate-50 p-2">
        <Lucide icon="Activity" className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  </Card>
);
const SparkLine: React.FC<{ points: number[] }> = ({ points }) => {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1 || 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full">
      <polyline points={d} fill="none" stroke={colors.blue} strokeWidth={1.5} />
    </svg>
  );
};
const Donut: React.FC<{ percent: number; label?: string }> = ({ percent, label }) => (
  <div className="relative h-32 w-40">
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: `conic-gradient(${colors.blue} 0 ${percent * 3.6}deg, #e5e7eb 0 360deg)`,
      }}
    />
    <div className="absolute inset-4 rounded-full bg-white" />
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-lg font-semibold text-slate-900">{percent}%</div>
      {label && <div className="text-[11px] text-slate-500">{label}</div>}
    </div>
  </div>
);
const Timeline: React.FC<{
  items: { who: string; time: string; text: string }[];
}> = ({ items }) => (
  <Card className="p-4">
    <div className="mb-2 flex items-center justify-between">
      <div className="text-sm font-semibold text-slate-800">Recent PTW Activity</div>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
        Last 24 hours
      </span>
    </div>
    <ol className="relative ml-3 border-l border-slate-200 pl-4 text-sm">
      {items.map((it, i) => (
        <li key={i} className="mb-4">
          <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{it.who}</span>
            <span className="text-[11px] text-slate-400">{it.time}</span>
          </div>
          <p className="text-slate-600">{it.text}</p>
        </li>
      ))}
    </ol>
  </Card>
);
const PtwTable: React.FC<{ rows: PtwRow[]; onSelect: (r: PtwRow) => void }> = ({
  rows,
  onSelect,
}) => (
  <Card>
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Lucide icon="Activity" className="h-4 w-4 text-blue-600" />
          Live PTW Requests
        </div>
        <p className="text-[11px] text-slate-500">
          Tap a row to open full PTW workflow (LS → SDO → XEN → PDC → Grid → Inspector).
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline-secondary" className="text-xs px-3 py-1.5">
          <Lucide icon="Download" className="mr-1 h-3 w-3" />
          Export
        </Button>
        <Button variant="primary" className="text-xs px-3 py-1.5">
          <Lucide icon="Plus" className="mr-1 h-3 w-3" />
          New PTW
        </Button>
      </div>
    </div>
    <div className=" max-h-[700px] overflow-auto">
      <table className="min-w-full text-xs md:text-sm">
        <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">PTW ID</th>
            <th className="px-3 py-2 text-left">Feeder</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Risk</th>
            <th className="px-3 py-2 text-left">Circle / Div</th>
            <th className="px-3 py-2 text-left">LS</th>
            <th className="px-3 py-2 text-left">Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onSelect(r)}
            >
              <td className="px-3 py-2 font-medium text-blue-700">{r.id}</td>
              <td className="px-3 py-2">{r.feeder}</td>
              <td className="px-3 py-2">{r.type}</td>
              <td className="text-center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] text-white",
                    STATUS_COLORS[r.status]
                  )}
                >
                
                  {r.status}
                </span>
              </td>
              <td className="px-3 py-2">{r.risk}</td>
              <td className="px-3 py-2">
                <div className="text-xs font-medium text-slate-800">{r.circle}</div>
                <div className="text-[11px] text-slate-500">
                  {r.division} · {r.subDivision}
                </div>
              </td>
              <td className="px-3 py-2">{r.lsName}</td>
              <td className="px-3 py-2">{Math.round(r.evidenceCompletion * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);
const LADDER_STEPS = [
  "Initiation",
  "Risk Assessment",
  "Approvals (SDO/XEN)",
  "Safety Inspector Review",
  "PDC Validation",
  "Grid Preparation",
  "PTW Issued",
  "SPT Conducted",
  "Evidence – Pre-work",
  "Execution Started",
  "Evidence – Post-work",
  "Grid Restoration",
  "Close-Out",
  "Compliance & Audit",
];
const Ladder: React.FC<{ active: number }> = ({ active }) => (
  <div className="space-y-1">
    {LADDER_STEPS.map((step, index) => (
      <div
        key={step}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-xs md:text-sm",
          index < active ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-50"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
            index < active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
          )}
        >
          {index + 1}
        </span>
        <span>{step}</span>
      </div>
    ))}
  </div>
);
const DetailDrawer: React.FC<{
  row: PtwRow | null;
  onClose: () => void;
}> = ({ row, onClose }) => {
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-40 flex" style={{zIndex:100}}>
      <div className="h-full w-full bg-black/30" onClick={onClose} />
      <aside className="ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                PTW DETAIL
              </span>
              {row.id} · {row.feeder}
            </div>
            <p className="text-[11px] text-slate-500">
              {row.circle} · {row.division} · {row.subDivision}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline-secondary"
              className="px-3 py-1.5 text-xs"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Ladder */}
            <div className="md:col-span-1">
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">
                14-Step PTW Ladder
              </div>
              <Ladder active={7} />
            </div>

            {/* Detail cards */}
            <div className="md:col-span-2 space-y-4">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">
                    PTW Overview
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-white",
                      STATUS_COLORS[row.status]
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                    {row.status}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs md:text-sm">
                  <div>
                    <dt className="text-slate-500">Type</dt>
                    <dd className="font-medium text-slate-900">{row.type}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Risk</dt>
                    <dd className="font-medium text-slate-900">{row.risk}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Start Time</dt>
                    <dd className="font-medium text-slate-900">{row.start}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">LS Name</dt>
                    <dd className="font-medium text-slate-900">{row.lsName}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Approval Path</dt>
                    <dd className="font-medium text-slate-900">{row.rolesPath}</dd>
                  </div>
                </dl>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="p-3">
                  <div className="mb-1 text-sm font-semibold text-slate-800">
                    Evidence Progress
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Donut
                      percent={Math.round(row.evidenceCompletion * 100)}
                      label="Photos & Geo"
                    />
                    <ul className="flex-1 space-y-1 text-xs text-slate-600">
                      <li>• Pre-work photos uploaded</li>
                      <li>• Post-work photos pending</li>
                      <li>• GPS & timestamp required for both</li>
                    </ul>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="mb-1 text-sm font-semibold text-slate-800">
                    Safety Notes
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>Verify earthing at both ends before starting work.</li>
                    <li>Ensure barricading and danger plates installed.</li>
                    <li>LS to brief team on SPT before energizing.</li>
                  </ul>
                </Card>
              </div>

              <Card className="p-3">
                <div className="mb-2 text-sm font-semibold text-slate-800">Actions</div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" className="px-3 py-1.5 text-xs">
                    Approve PTW
                  </Button>
                  <Button variant="outline-secondary" className="px-3 py-1.5 text-xs">
                    Return with Comments
                  </Button>
                  <Button variant="outline-secondary" className="px-3 py-1.5 text-xs">
                    Request Checklist Update
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
export default function EsafetyDashboard() {
  const [scopeCircle, setScopeCircle] = useState<string | "ALL">("ALL");
  const [selected, setSelected] = useState<PtwRow | null>(null);

  const filteredRows = useMemo(
    () =>
      scopeCircle === "ALL"
        ? PTW_ROWS
        : PTW_ROWS.filter((r) => r.circle === scopeCircle),
    [scopeCircle]
  );

  const kpiActive = filteredRows.filter((r) =>
    ["Issued", "Ready", "In-Progress"].includes(r.status)
  ).length;
  const kpiIssuedToday = filteredRows.filter((r) => r.status === "Issued").length;
  const kpiClosed = filteredRows.filter((r) => r.status === "Closed").length;
  const kpiHighRisk = filteredRows.filter((r) => r.risk === "High").length;

  const typeTrend = [10, 15, 18, 20, 22, 19, 24]; // mock small trend

  const donutPercent =
    filteredRows.length === 0
      ? 0
      : Math.round((kpiClosed / filteredRows.length) * 100);

  const typeSplit = {
    Planned: filteredRows.filter((r) => r.type === "Planned").length,
    Emergency: filteredRows.filter((r) => r.type === "Emergency").length,
    Forced: filteredRows.filter((r) => r.type === "Forced").length,
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* HEADER matching your blue sidebar theme */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `${colors.blue}11`,
                boxShadow: `inset 0 0 0 1px ${colors.blue}33`,
              }}
            >
              <Lucide icon="Zap" className="h-4 w-4" style={{ color: colors.blue }} />
            </div>
            <div>
              <h1
                className="text-lg font-semibold leading-tight md:text-xl"
                style={{ color: colors.navy }}
              >
                E-Safety (PTW) Dashboard
              </h1>
              <p className="text-[11px] text-slate-500">
                Live view of PTW requests, approvals, hazards & SPT compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 shadow-sm"
              value={scopeCircle}
              onChange={(e) =>
                setScopeCircle((e.target.value || "ALL") as string | "ALL")
              }
            >
              <option value="ALL">All Circles</option>
              {CIRCLES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button variant="outline-secondary" className="px-3 py-1.5 text-xs">
              <Lucide icon="RefreshCw" className="mr-1 h-3 w-3" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* KPIs */}
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatCard
            label="Active PTWs"
            value={kpiActive}
            subtitle="Issued, Ready & In-Progress"
            tone="ok"
          />
          <StatCard
            label="Issued Today"
            value={kpiIssuedToday}
            subtitle="New PTWs in current day"
          />
          <StatCard
            label="Closed (Selected Scope)"
            value={kpiClosed}
            subtitle={`${donutPercent}% of PTWs`}
          />
          <StatCard
            label="High-Risk Jobs"
            value={kpiHighRisk}
            subtitle="Require strict SPT & evidence"
            tone={kpiHighRisk > 0 ? "warn" : "ok"}
          />
        </section>

        {/* Trend + type split + donut */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  PTW Volume Trend
                </div>
                <p className="text-[11px] text-slate-500">
                  Daily PTW count for the last week.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                Preview
              </span>
            </div>
            <SparkLine points={typeTrend} />
          </Card>

          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">
              PTW Type Split (Scope)
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Planned –{" "}
                {typeSplit.Planned}
              </span>
              <span className="flex items-center gap-1 text-slate-700">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> Emergency –{" "}
                {typeSplit.Emergency}
              </span>
              <span className="flex items-center gap-1 text-slate-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Forced –{" "}
                {typeSplit.Forced}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              {(() => {
                const total =
                  typeSplit.Planned + typeSplit.Emergency + typeSplit.Forced || 1;
                const pP = (typeSplit.Planned / total) * 100;
                const pE = (typeSplit.Emergency / total) * 100;
                const pF = (typeSplit.Forced / total) * 100;
                return (
                  <div className="flex h-full">
                    <div style={{ width: `${pP}%` }} className="bg-blue-600" />
                    <div style={{ width: `${pE}%` }} className="bg-orange-500" />
                    <div style={{ width: `${pF}%` }} className="bg-amber-400" />
                  </div>
                );
              })()}
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">
                PTW Close-Out Ratio
              </div>
              <p className="text-[11px] text-slate-500">
                Closed PTWs vs total in current filter.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                <li>• Aim for 100% same-day closure for low-risk work.</li>
                <li>• High-risk work must have full pre/post evidence.</li>
              </ul>
            </div>
            <Donut percent={donutPercent} label="Closed" />
          </Card>
        </section>

        {/* Table + side column */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PtwTable rows={filteredRows} onSelect={setSelected} />
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  My Action Queue
                </div>
                <Button variant="outline-secondary" className="px-2 py-1 text-[11px]">
                  <Lucide icon="ListChecks" className="mr-1 h-3 w-3" />
                  View All
                </Button>
              </div>
              <ul className="space-y-2 text-xs md:text-sm">
                {ACTION_QUEUE.map((a, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{a.item}</div>
                      <div className="text-[11px] text-slate-500">{a.who}</div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] text-white",
                        a.tone === "bad" && "bg-rose-600",
                        a.tone === "warn" && "bg-amber-500",
                        a.tone === "info" && "bg-slate-700"
                      )}
                    >
                      {a.badge}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Timeline items={TIMELINE} />
          </div>
        </section>
      </main>

      {/* Drawer with PTW detail */}
      <DetailDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
