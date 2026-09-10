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

export type PtwType = "Planned" | "Emergency" | "Misc";

export interface PtwRow {
  id: string;
  feeder: string;
  type: PtwType;
  status: PtwStatus;
  circle: string;
  division: string;
  subDivision: string;
  start: string;
  lsName: string;
  rolesPath: string;
  evidenceCompletion: number; // 0..1
}

export const PTW_ROWS: PtwRow[] = [
  {
    id: "PTW-000812",
    feeder: "FE-12-MLT",
    type: "Planned",
    status: "PTW_ISSUED",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Cantt Sub-Div",
    start: "2026-08-25 10:00",
    lsName: "Ali Raza",
    rolesPath: "LS → SDO → XEN → SE → Grid → Inspector",
    evidenceCompletion: 0.75,
  },
  {
    id: "PTW-000769",
    feeder: "FE-07-BWP",
    type: "Emergency",
    status: "IN_EXECUTION",
    circle: "Bahawalpur Circle",
    division: "Bahawalpur Urban",
    subDivision: "Model Town",
   start: "2026-08-25 10:00",
    lsName: "Usman Khan",
    rolesPath: "LS → SDO → Grid → Inspector",
    evidenceCompletion: 0.95,
  },
  {
    id: "PTW-000655",
    feeder: "FE-03-DGK",
    type: "Planned",
    status: "SUBMITTED",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
    start: "2026-08-25 10:00",
    lsName: "Imran Shah",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 0.4,
  },
  {
    id: "PTW-000590",
    feeder: "FE-21-MLT",
    type: "Emergency",
    status: "GRID_RESTORED_AND_CLOSED",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
   start: "2026-08-25 10:00",
    lsName: "Zeeshan Ali",
    rolesPath: "LS → SDO → XEN → SE → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000540",
    feeder: "FE-09-BWP",
    type: "Misc",
    status: "XEN_REJECTED",
    circle: "Bahawalpur Circle",
    division: "Bahawalpur Urban",
    subDivision: "Model Town",
   start: "2026-08-25 10:00",
    lsName: "Ahmed Nawaz",
    rolesPath: "LS → SDO → XEN",
    evidenceCompletion: 0.2,
  },
  {
    id: "PTW-000488",
    feeder: "FE-05-DGK",
    type: "Planned",
    status: "SDO_CANCELLED",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Kot Chutta",
      start: "2026-08-25 10:00",

    lsName: "Rashid Mehmood",
    rolesPath: "LS → SDO",
    evidenceCompletion: 0.1,
  },
  {
    id: "PTW-000425",
    feeder: "FE-15-MLT",
    type: "Emergency",
    status: "DRAFT",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Cantt Sub-Div",
     start: "2026-08-25 10:00",

    lsName: "Faisal Iqbal",
    rolesPath: "LS → SDO → XEN → PDC",
    evidenceCompletion: 0.55,
  },
  {
    id: "PTW-000390",
    feeder: "FE-11-BWP",
    type: "Planned",
    status: "XEN_APPROVED_TO_PDC",
    circle: "Bahawalpur Circle",
    division: "Bahawalpur Rural",
    subDivision: "Hasilpur",
     start: "2026-08-25 10:00",

    lsName: "Tariq Jameel",
    rolesPath: "LS → SDO → XEN → SE",
    evidenceCompletion: 0.8,
  },
  {
    id: "PTW-000355",
    feeder: "FE-08-DGK",
    type: "Emergency",
    status: "PDC_DELEGATED_TO_GRID",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Taunsa",
      start: "2026-08-25 10:00",

    lsName: "Sajid Hussain",
    rolesPath: "LS → SDO → Grid",
    evidenceCompletion: 0.9,
  },
  {
    id: "PTW-000310",
    feeder: "FE-18-MLT",
    type: "Misc",
    status: "COMPLETION_SUBMITTED",
    circle: "Multan Circle",
    division: "Multan City",
    subDivision: "Shah Rukn-e-Alam",
      start: "2026-08-25 10:00",

    lsName: "Naeem Abbas",
    rolesPath: "LS → SDO → XEN → PDC → Grid",
    evidenceCompletion: 1,
  },
  {
    id: "PTW-000265",
    feeder: "FE-02-BWP",
    type: "Planned",
    status: "CANCELLATION_REQUESTED_BY_LS",
    circle: "Bahawalpur Circle",
    division: "Bahawalpur Rural",
    subDivision: "Hasilpur",
     start: "2026-08-25 10:00",
    lsName: "Mudassar Nazir",
    rolesPath: "LS → SDO → XEN",
    evidenceCompletion: 0.3,
  },
  {
    id: "PTW-000220",
    feeder: "FE-13-DGK",
    type: "Emergency",
    status: "PDC_RETURNED_TO_LS",
    circle: "D.G. Khan Circle",
    division: "DGK Rural",
    subDivision: "Kot Chutta",
    start: "2026-08-25 10:00",
    lsName: "Shahid Latif",
    rolesPath: "LS → SDO",
    evidenceCompletion: 0.15,
  },
];

export const CIRCLES = [
  { name: "Multan Circle" },
  { name: "Bahawalpur Circle" },
  { name: "D.G. Khan Circle" },
];


export const STATUS_COLORS: Record<PtwStatus, string> = {
  DRAFT: "#6b7280",
  SUBMITTED: "#3b82f6",
  SDO_RETURNED: "#f59e0b",
  SDO_CANCELLED: "#9ca3af",
  SDO_FORWARDED_TO_XEN: "#8b5cf6",
  XEN_RETURNED_TO_SDO: "#f97316",
  XEN_REJECTED: "#ef4444",
  XEN_APPROVED_TO_PDC: "#10b981",
  PDC_DELEGATED_TO_GRID: "#0ea5e9",
  GRID_PRECHECKS_DONE: "#14b8a6",
  PTW_ISSUED: "#2563eb",
  IN_EXECUTION: "#4f46e5",
  COMPLETION_SUBMITTED: "#0891b2",
  GRID_RESTORED_AND_CLOSED: "#16a34a",
  CANCELLATION_REQUESTED_BY_LS: "#f43f5e",
  GRID_CANCELLATION_CONFIRMED_AND_CLOSED: "#64748b",
  LS_RESUBMIT_TO_XEN: "#0ea5e9",
  XEN_RETURNED_TO_LS: "#f59e0b",
  PDC_RETURNED_TO_LS: "#f97316",
  LS_RESUBMIT_TO_PDC: "#8b5cf6",
  PDC_REJECTED: "#ef4444",
  CANCELLATION_APPROVED_BY_SDO: "#9ca3af",
  PDC_CONFIRMED: "#10b981",
  PENDING_PDC_CONFIRMATION: "#eab308",
  GRID_RESOLVE_REQUIRED: "#f43f5e",
  RE_SUBMITTED_TO_PDC: "#06b6d4",
  NO_PTW_APPROVED_BY_SDO: "#a855f7",
};

// Action queue (static for demo)
export const ACTION_QUEUE = [
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
];

export const TIMELINE = [
  { who: "LS Multan", time: "09:05", text: "Created PTW-000812 with site photos." },
  { who: "SDO BWP", time: "09:18", text: "Returned PTW-000769 for hazard details." },
  { who: "XEN DGK", time: "09:40", text: "Forwarded PTW-000655 to PDC." },
  { who: "Grid BWP", time: "10:10", text: "Completed rack-out for FE-07-BWP." },
];
