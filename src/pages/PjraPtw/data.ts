// src/data/pjra.ts
export const ORGS = [
  { id: 1, name: "North Region", divisions: ["A", "B"], feeders: ["F-101", "F-102"] },
  { id: 2, name: "South Region", divisions: ["C"], feeders: ["F-201"] },
] as const;

export const ASSET_TYPES = ["Line", "Transformer", "Feeder", "Substation"] as const;

export const HAZARDS = [
  { id: 1, name: "Electrical Shock" },
  { id: 2, name: "Arc Flash" },
  { id: 3, name: "Fall from Height" },
  { id: 4, name: "Hot Surface" },
] as const;

export const CONTROLS = [
  { id: 101, name: "Insulated Gloves" },
  { id: 102, name: "Lockout/Tagout" },
  { id: 103, name: "Insulated Mat" },
  { id: 104, name: "Face Shield" },
] as const;

export const USERS = [
  { id: 10, name: "Ali Khan" },
  { id: 11, name: "Sara Ahmed" },
  { id: 12, name: "Bilal Hussain" },
  { id: 13, name: "Hina R." },
  { id: 14, name: "Junaid I." },
] as const;

export const CATEGORIES = ["Maintenance", "Emergency", "Inspection", "Upgrade"] as const;

export type Asset = {
  region?: number;
  division?: string;
  feeder?: string;
  assetType?: typeof ASSET_TYPES[number];
  assetId?: string;
  gps?: { lat?: string; lng?: string };
};

export type HazardSelection = {
  hazardId: number;
  controlIds: number[];
  additional?: string;
};

export type SwitchPlan = { id: string; name: string; steps: string[] };

export type FormState = {
  enterprise: boolean;
  asset: Asset;
  hazards: HazardSelection[];
  likelihood?: number;
  severity?: number;
  title?: string;
  description?: string;
  category?: (typeof CATEGORIES)[number];
  windowStart?: string;
  windowEnd?: string;
  switchPlans: SwitchPlan[];
  crewLead?: number;
  crewMembers: number[];
  skillTags: string[];
  evidence: { photos: string[]; gps?: { lat?: string; lng?: string }; ts?: string };
  lsSignature?: { type: "draw" | "pin"; value?: string };
  status: "draft" | "ready_to_submit" | "submitted" | "withdrawn";
};

export type PermitRow = {
  id: string;
  title: string;
  region: string;
  lead: string;
  members: string[];
  status: "active" | "approved" | "submitted" | "draft";
  windowStart: string;
  windowEnd: string;
};

export const uid = () => Math.random().toString(36).slice(2, 9);
export const todayIso = () => new Date().toISOString().slice(0, 16);
export const computeRisk = (l?: number, s?: number) => {
  const ll = Math.max(1, Math.min(5, l || 0));
  const ss = Math.max(1, Math.min(5, s || 0));
  return ll * ss;
};
export const overlap = (a1?: string, a2?: string, b1?: string, b2?: string) => {
  if (!a1 || !a2 || !b1 || !b2) return false;
  const A1 = +new Date(a1); const A2 = +new Date(a2);
  const B1 = +new Date(b1); const B2 = +new Date(b2);
  return A1 <= B2 && B1 <= A2;
};

// ----- tiny localStorage-backed dummy store -----
const KEY = "__pjra_ptw_permits__";

const DEFAULT_PERMITS: PermitRow[] = [
  {
    id: "PTW-1001",
    title: "Feeder F-101 Maintenance",
    region: "North Region",
    lead: "Ali Khan",
    members: ["Sara Ahmed", "Bilal Hussain"],
    status: "active",
    windowStart: "2025-09-23T08:00",
    windowEnd: "2025-09-23T14:00",
  },
  {
    id: "PTW-1002",
    title: "Transformer T-55 Inspection",
    region: "South Region",
    lead: "Junaid I.",
    members: ["Hina R."],
    status: "approved",
    windowStart: "2025-09-24T09:00",
    windowEnd: "2025-09-24T13:00",
  },
];

function load(): PermitRow[] {
  if (typeof window === "undefined") return DEFAULT_PERMITS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PermitRow[]) : DEFAULT_PERMITS;
  } catch {
    return DEFAULT_PERMITS;
  }
}
function save(list: PermitRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getPermits(): PermitRow[] {
  return load();
}
export function addPermit(row: PermitRow) {
  const list = load();
  list.unshift(row);
  save(list);
}
export function hasCrewConflict(
  crewNames: string[],
  windowStart?: string,
  windowEnd?: string
): boolean {
  if (!windowStart || !windowEnd) return false;
  const list = load();
  return list.some((p) => {
    const statusOk = ["submitted", "approved", "active"].includes(p.status);
    const timeOverlap = overlap(windowStart, windowEnd, p.windowStart, p.windowEnd);
    const anyShared = crewNames.some((n) => [p.lead, ...p.members].includes(n));
    return statusOk && timeOverlap && anyShared;
  });
}
