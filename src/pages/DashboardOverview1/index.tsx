
"use client";

import React, { useMemo, useState } from "react";

/*
  E‑Safety MEPCO — Dashboard (Safety‑Only Edition)
  - No monetary metrics. Only counts, percentages, and SLA/time-based indicators.
  - Fixed header style syntax (background + boxShadow).
  - Includes a tiny in‑page test harness to validate invariants.
  - TailwindCSS UI, no external charts.
*/

// ============== THEME & HELPERS ==============
const colors = {
  blue: "#0A3AA9",
  navy: "#0B1D4D",
  orange: "#E95420",
  bg: "#F5F7FA",
};

const STATUS_COLORS: Record<string, string> = {
  Issued: "bg-blue-600",
  Ready: "bg-teal-600",
  "In-Progress": "bg-indigo-600",
  Closed: "bg-green-600",
  Rejected: "bg-red-600",
};

const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

// ============== MOCK DATA (SAFETY FOCUSED) ==============
const circles = [
  { name: "Multan Circle", spt: 0.86, active: 42 },
  { name: "Bahawalpur Circle", spt: 0.73, active: 31 },
  { name: "D.G. Khan Circle", spt: 0.92, active: 18 },
];

type Ptw = {
  id: string;
  feeder: string;
  type: "Planned" | "Emergency" | "Misc";
  status: "Issued" | "Ready" | "In-Progress" | "Closed" | "Rejected";
  risk: "Low" | "Medium" | "High";
  start: string;
  roles: string;
  evidence: number;
  circle: string;
};

const ptws: Ptw[] = [
  {
    id: "PTW-000812",
    feeder: "FE-12-MLT",
    type: "Planned",
    status: "Ready",
    risk: "Medium",
    start: "2025-10-21 10:00",
    roles: "LS/SDO/XEN/Inspector/Grid",
    evidence: 0.67,
    circle: "Multan Circle",
  },
  {
    id: "PTW-000769",
    feeder: "FE-07-BWP",
    type: "Emergency",
    status: "In-Progress",
    risk: "High",
    start: "2025-10-21 08:20",
    roles: "LS/SDO/Inspector/Grid",
    evidence: 1.0,
    circle: "Bahawalpur Circle",
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "Issued",
    risk: "Low",
    start: "2025-10-22 09:00",
    roles: "LS/SDO/XEN/SE/Inspector",
    evidence: 0.4,
    circle: "D.G. Khan Circle",
  },
];

const actionQueue = [
  {
    who: "SDO Multan",
    at: "10:30",
    item: "Review Initiation (PTW‑000812)",
    badge: "Due 1h",
    tone: "warn",
  },
  {
    who: "XEN DGK",
    at: "11:15",
    item: "Approve (PTW‑000655)",
    badge: "Today",
    tone: "info",
  },
  {
    who: "PDC BWP",
    at: "11:40",
    item: "Validate feeder conflict (PTW‑000769)",
    badge: "Overdue",
    tone: "bad",
  },
  {
    who: "Grid Incharge BWP",
    at: "12:05",
    item: "Rack‑out checklist",
    badge: "Action",
    tone: "warn",
  },
];

const timeline = [
  { who: "LS", time: "09:05", text: "Submitted PTW‑000812 with Emergency evidence" },
  { who: "SDO", time: "09:18", text: "Requested changes on checklist‑2 (Hazards)" },
  { who: "XEN", time: "09:40", text: "Forwarded PTW‑000655 to PDC" },
  { who: "Grid", time: "10:10", text: "Completed rack‑out for FE‑07‑BWP" },
];

// ============== LIGHTWEIGHT TEST HARNESS ==============
const LADDER_STEPS = [
  "Initiation",
  "Risk Assessment",
  "Approvals (SDO/XEN)",
  "Safety Inspector Review",
  "PDC Validation",
  "Grid Preparation",
  "PTW Issued",
  "SPT Conducted",
  "Evidence – Pre‑work",
  "Execution Started",
  "Evidence – Post‑work",
  "Grid Restoration",
  "Close‑out",
  "Compliance & Audit",
];

function runTests() {
  const failures: string[] = [];
  // T1: Ladder must always be 14 steps
  if (LADDER_STEPS.length !== 14)
    failures.push(`Ladder length expected 14, got ${LADDER_STEPS.length}`);
  // T2: Status distribution must be among known statuses
  const knownStatuses = new Set([
    "Issued",
    "Ready",
    "In-Progress",
    "Closed",
    "Rejected",
  ]);
  ptws.forEach((p) => {
    if (!knownStatuses.has(p.status))
      failures.push(`Unknown status on ${p.id}: ${p.status}`);
  });
  // T3: Types within allowed set
  const allowedTypes = new Set(["Planned", "Emergency", "Misc"]);
  ptws.forEach((p) => {
    if (!allowedTypes.has(p.type))
      failures.push(`Unknown type on ${p.id}: ${p.type}`);
  });
  // T4: Evidence within [0..1]
  ptws.forEach((p) => {
    if (p.evidence < 0 || p.evidence > 1)
      failures.push(`Evidence out of range on ${p.id}: ${p.evidence}`);
  });
  // T5: No finance-like strings
  const badWords = ["amount", "pkr", "price", "cost", "budget"];
  const blob = JSON.stringify(ptws).toLowerCase();
  if (badWords.some((w) => blob.includes(w)))
    failures.push("Finance-like field detected in PTW dataset");

  // T6: At least one circle
  if (circles.length === 0) failures.push("No circles defined for map");

  return failures;
}

const TestPanel: React.FC<{ results: string[] }> = ({ results }) => (
  <div className="mx-auto max-w-7xl px-4">
    {results.length ? (
      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <div className="font-semibold">Test Failures: {results.length}</div>
        <ul className="list-disc pl-5">
          {results.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    ) : (
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
        All tests passed
      </div>
    )}
  </div>
);

// ============== WIDGETS ==============
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>;

const StatCard: React.FC<{
  title: string;
  value: string | number;
  delta?: { val: string; color: "ok" | "bad" };
}> = ({ title, value, delta }) => (
  <Card className="p-4">
    <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    {delta && (
      <div
        className={cn(
          "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          delta.color === "ok"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        )}
      >
        {delta.val}
      </div>
    )}
  </Card>
);

// Simple SVG spark line (counts)
const SparkLine: React.FC<{ points: number[] }> = ({ points }) => {
  const max = Math.max(...points, 1);
  const path = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-full">
      <polyline fill="none" stroke="#0A3AA9" strokeWidth="2" points={path} />
      <polyline
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="2 3"
        points={path}
      />
    </svg>
  );
};

// Donut chart (single metric)
const Donut: React.FC<{ percent: number; center?: string }> = ({
  percent,
  center,
}) => (
  <div className="relative mx-auto h-40 w-40">
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: `conic-gradient(${colors.blue} ${percent * 3.6}deg, #e5e7eb 0)`,
      }}
    />
    <div className="absolute inset-4 rounded-full bg-white" />
    <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-800">
      {center ?? `${percent}%`}
    </div>
  </div>
);

// Pie chart (3 segments)
const Pie3: React.FC<{ vals: number[]; colors: string[] }> = ({
  vals,
  colors: cols,
}) => {
  const sum = vals.reduce((a, b) => a + b, 0) || 1;
  let start = 0;
  const stops = vals.map((v) => {
    const deg = (v / sum) * 360;
    const s = start;
    const e = start + deg;
    start = e;
    return [s, e];
  });
  const bg = `conic-gradient(${cols[0]} 0 ${stops[0][1]}deg, ${cols[1]} ${stops[1][0]}deg ${stops[1][1]}deg, ${cols[2]} ${stops[2][0]}deg 360deg)`;
  return <div className="h-40 w-40 rounded-full" style={{ background: bg }} />;
};

// Timeline list
const Timeline: React.FC<{
  items: { who: string; time: string; text: string }[];
}> = ({ items }) => (
  <Card className="p-4">
    <div className="mb-2 text-sm font-semibold text-gray-700">Recent Activities</div>
    <ol className="relative ml-4 border-l border-gray-200 pl-4">
      {items.map((it, i) => (
        <li key={i} className="mb-4">
          <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-[#0A3AA9]" />
          <div className="text-sm text-gray-900">
            <span className="font-medium">{it.who}</span> — {it.text}
          </div>
          <div className="text-xs text-gray-500">{it.time}</div>
        </li>
      ))}
    </ol>
  </Card>
);

// Table (no money columns)
const Table: React.FC<{
  rows: Ptw[];
  onRow?: (r: Ptw) => void;
}> = ({ rows, onRow }) => (
  <Card>
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="text-sm font-semibold text-gray-700">PTW Master</div>
      <div className="space-x-2">
        <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          Export to Excel
        </button>
        <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          Export to PDF
        </button>
      </div>
    </div>
    <div className="max-h-[360px] overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            {["ID", "Feeder", "Type", "Status", "Risk", "Start", "Roles", "Evidence"].map(
              (h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr
              key={r.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onRow && onRow(r)}
            >
              <td className="px-3 py-2 font-medium text-[#0A3AA9]">{r.id}</td>
              <td className="px-3 py-2">{r.feeder}</td>
              <td className="px-3 py-2">{r.type}</td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white",
                    STATUS_COLORS[r.status]
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" /> {r.status}
                </span>
              </td>
              <td className="px-3 py-2">{r.risk}</td>
              <td className="px-3 py-2">{r.start}</td>
              <td className="px-3 py-2 text-gray-600">{r.roles}</td>
              <td className="px-3 py-2">{Math.round(r.evidence * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

// Drawer with 14-step ladder
const Drawer: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex">
      <div className="h-full w-full bg-black/30" onClick={onClose} />
      <aside className="h-full w-full max-w-4xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="h-full overflow-auto p-4">{children}</div>
      </aside>
    </div>
  );
};

const Ladder: React.FC<{ active: number }> = ({ active }) => (
  <div className="space-y-1">
    {LADDER_STEPS.map((s, i) => (
      <div
        key={s}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          i < active ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
            i < active ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800"
          )}
        >
          {i + 1}
        </span>
        <span>{s}</span>
      </div>
    ))}
  </div>
);

// Pakistan outline (placeholder SVG)
const PAK =
  "M120,40 L160,60 L180,100 L170,140 L200,180 L210,230 L230,260 L210,300 L180,320 L150,300 L140,260 L120,240 L90,220 L80,180 L90,140 L100,100 Z";

// ============== PAGE (SAFETY‑ONLY) ==============
export default function Page() {
  const [scopeCircle, setScopeCircle] = useState<string | null>(null);
  const [open, setOpen] = useState<Ptw | null>(null);
  const testResults = useMemo(() => runTests(), []);

  const filtered = ptws.filter((p) => !scopeCircle || p.circle === scopeCircle);

  // KPIs (counts / % only)
  const kpiActive = filtered.filter((r) =>
    ["Issued", "Ready", "In-Progress"].includes(r.status)
  ).length;
  const kpiPendingApprovals = 5; // mock
  const kpiIssuedToday = filtered.filter((r) => r.status === "Issued").length;
  const kpiCrewsOnSite = 12; // mock

  // Distribution
  const statusCounts = [
    filtered.filter((r) => r.status === "Issued").length,
    filtered.filter((r) => r.status === "Ready").length,
    filtered.filter((r) => r.status === "In-Progress").length,
    filtered.filter((r) => r.status === "Closed").length,
  ];

  const typeSplit = [
    filtered.filter((r) => r.type === "Planned").length,
    filtered.filter((r) => r.type === "Emergency").length,
    filtered.filter((r) => r.type === "Misc").length,
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: colors.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* fixed style syntax */}
            <div
              className="h-9 w-9 rounded-xl"
              style={{
                background: `${colors.blue}22`,
                boxShadow: `inset 0 0 0 1px ${colors.blue}33`,
              }}
            />
            <div>
              <h1 className="text-xl font-semibold" style={{ color: colors.navy }}>
                E‑Safety MEPCO — Dashboard
              </h1>
              <p className="text-xs text-gray-500">Template widgets → Safety metrics only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input className="rounded-lg border px-3 py-1.5 text-sm" placeholder="Search…" />
            <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              Reload Data
            </button>
            <div className="h-9 w-9 rounded-full bg-gray-200" />
          </div>
        </div>
      </header>

      {/* Tests banner */}
      <TestPanel results={testResults} />

      {/* Body */}
      <main className="mx-auto max-w-7xl space-y-6 p-4">
        {/* General Report */}
        <section>
          <div className="mb-3 text-sm font-semibold text-gray-700">General Report</div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Active PTWs"
              value={kpiActive}
              delta={{ val: "+3% vs yesterday", color: "ok" }}
            />
            <StatCard
              title="Pending Approvals"
              value={kpiPendingApprovals}
              delta={{ val: "−2 in last hour", color: "ok" }}
            />
            <StatCard title="Issued Today" value={kpiIssuedToday} delta={{ val: "+1 new", color: "ok" }} />
            <StatCard title="Field Crews On‑Site" value={kpiCrewsOnSite} />
          </div>
        </section>

        {/* Trend + Type Split + Status Donut */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-700">PTW Volume Trend</div>
                <div className="text-xs text-gray-500">Counts — This Month vs Last Month</div>
              </div>
              <button className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50">
                Filter by Type
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div>
                <div className="text-xs text-gray-500">This Month</div>
                <div className="text-xl font-semibold">152</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Last Month</div>
                <div className="text-xl font-semibold">121</div>
              </div>
            </div>
            <SparkLine points={[12, 18, 24, 30, 26, 34, 38, 36, 42]} />
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">PTW Type Split</div>
              <button className="text-xs text-[#0A3AA9]">Show More</button>
            </div>
            <div className="flex items-center gap-6">
              <Pie3 vals={typeSplit} colors={["#0A3AA9", "#E95420", "#FFB000"]} />
              <ul className="text-sm text-gray-700">
                <li className="mb-1">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#0A3AA9]" />
                  Planned — {typeSplit[0]}
                </li>
                <li className="mb-1">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#E95420]" />
                  Emergency — {typeSplit[1]}
                </li>
                <li>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#FFB000]" />
                  Misc — {typeSplit[2]}
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold text-gray-700">Status Distribution</div>
            <div className="flex items-center justify-center">
              <Donut
                percent={Math.round((statusCounts[3] / Math.max(kpiActive, 1)) * 100)}
                center={`${statusCounts[0] + statusCounts[1] + statusCounts[2]} open`}
              />
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-700">
              <li>
                <span className="mr-2 inline-block h-2 w-2 rounded bg-blue-600" />
                Issued — {statusCounts[0]}
              </li>
              <li>
                <span className="mr-2 inline-block h-2 w-2 rounded bg-teal-600" />
                Ready — {statusCounts[1]}
              </li>
              <li>
                <span className="mr-2 inline-block h-2 w-2 rounded bg-indigo-600" />
                In‑Progress — {statusCounts[2]}
              </li>
              <li>
                <span className="mr-2 inline-block h-2 w-2 rounded bg-green-600" />
                Closed — {statusCounts[3]}
              </li>
            </ul>
          </Card>
        </section>

        {/* Map + Action Queue */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Pakistan — Circle Map</div>
              <select
                className="rounded-lg border px-2 py-1 text-sm"
                value={scopeCircle ?? ""}
                onChange={(e) => setScopeCircle(e.target.value || null)}
              >
                <option value="">All Circles</option>
                {circles.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <svg viewBox="60 20 220 320" className="h-64 w-full">
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={colors.blue} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={colors.blue} stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path d={PAK} fill="url(#g1)" stroke={colors.blue} strokeWidth="1" />
              {circles.map((c, i) => {
                const size = 6 + Math.min(18, c.active);
                const col =
                  c.spt > 0.9 ? "#16a34a" : c.spt > 0.8 ? "#22c55e" : c.spt > 0.7 ? "#eab308" : "#ef4444";
                const centers = [
                  { x: 180, y: 220 },
                  { x: 210, y: 300 },
                  { x: 120, y: 240 },
                ];
                const ctr = centers[i];
                return (
                  <g key={c.name} className="cursor-pointer" onClick={() => setScopeCircle(c.name)}>
                    <circle cx={ctr.x} cy={ctr.y} r={size} fill={col} opacity={0.85} />
                    <text
                      x={ctr.x}
                      y={ctr.y - (size + 4)}
                      textAnchor="middle"
                      fontSize={8}
                      fill={colors.navy}
                    >
                      {c.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Card>
          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold text-gray-700">My Action Queue</div>
            <ul className="space-y-2">
              {actionQueue.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <div>
                    <div className="font-medium text-gray-900">{a.item}</div>
                    <div className="text-xs text-gray-500">
                      {a.who} · {a.at}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs text-white",
                      a.tone === "bad"
                        ? "bg-red-600"
                        : a.tone === "warn"
                        ? "bg-amber-500"
                        : "bg-gray-700"
                    )}
                  >
                    {a.badge}
                  </span>
                </li>
              ))}
            </ul>
            <button className="mt-3 w-full rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              View More
            </button>
          </Card>
        </section>

        {/* Mini KPI strip */}
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-700">SPT Compliance</div>
            <div className="flex items-center justify-between">
              <Donut percent={82} />
              <div className="text-sm text-gray-600">Target 100%</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-700">Evidence Complete</div>
            <SparkLine points={[62, 68, 71, 74, 79, 83, 88]} />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-700">Restoration On‑Time</div>
            <div className="mt-2 text-2xl font-semibold">92%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-semibold text-gray-700">SLA Breaches (7d)</div>
            <SparkLine points={[1, 3, 2, 4, 3, 5, 2]} />
          </Card>
        </section>

        {/* Table + Timeline + Notes */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Table rows={filtered} onRow={(r) => setOpen(r)} />
          </div>
          <div className="space-y-4">
            <Timeline items={timeline} />
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">Important Notes</div>
                <div className="space-x-2 text-gray-500">
                  <button>{"<"}</button>
                  <button>{">"}</button>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                Always verify danger plates & earthing before issuing PTW. GPS & timestamp are mandatory
                for pre/post evidence.
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">View Notes</button>
                <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Dismiss</button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Drawer details */}
      <Drawer open={!!open} title={open ? `${open.id} · ${open.feeder}` : ""} onClose={() => setOpen(null)}>
        {open && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <div className="mb-2 text-xs font-semibold uppercase text-gray-500">14‑Step Ladder</div>
              <Ladder active={7} />
            </div>
            <div className="col-span-2 space-y-4">
              <Card className="p-3">
                <div className="text-sm font-semibold text-gray-700">Overview</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium">{open.type}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd className="font-medium">{open.status}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Start</dt>
                    <dd className="font-medium">{open.start}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Roles</dt>
                    <dd className="font-medium">{open.roles}</dd>
                  </div>
                </dl>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="text-sm font-semibold text-gray-700">Evidence Gallery</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-video rounded-lg bg-gray-100" />
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">GPS & Timestamp enforced</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm font-semibold text-gray-700">Notes & Remarks</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                    <li>SDO: Replace damaged pole clamps</li>
                    <li>XEN: Verify load isolation window</li>
                    <li>PDC: No feeder conflict found</li>
                  </ul>
                </Card>
              </div>
              <Card className="p-3">
                <div className="text-sm font-semibold text-gray-700">Actions</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-[#0A3AA9] px-3 py-1.5 text-sm text-white hover:opacity-90">
                    Approve
                  </button>
                  <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Return</button>
                  <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                    Request Changes
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Drawer>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} E‑Safety MEPCO · Dashboard Preview
      </footer>
    </div>
  );
}
