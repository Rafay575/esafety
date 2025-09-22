import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
  { icon: "Home", title: "Dashboard", pathname: "/" },
  { icon: "Home", title: "Users", pathname: "/users" },

  // ─────────────────── MEPCO E-Safety (PTW) ───────────────────
  {
    icon: "Activity",
    title: "E-Safety (PTW)",
    subMenu: [
      // 1) LS – PJRA + PTW (with Team Allocation & Conflict Checks)
      {
        icon: "ClipboardList",
        title: "LS – PJRA + PTW",
        subMenu: [
          { icon: "FilePlus2",  title: "Create PJRA + PTW", pathname: "/ls/ptw/create" },
          { icon: "Users",      title: "Team Allocation",   pathname: "/ls/team/allocation" },
          { icon: "AlertOctagon", title: "Conflict Checks", pathname: "/ls/team/conflicts" },
          { icon: "FileText",   title: "Drafts",            pathname: "/ls/ptw/drafts" },
          { icon: "Send",       title: "Submit to SDO",     pathname: "/ls/ptw/submit" },
          { icon: "Archive",    title: "Archive",           pathname: "/ls/ptw/archive" },
        ],
      },

      // 2) SDO Review
      {
        icon: "Briefcase",
        title: "SDO Review",
        subMenu: [
          { icon: "ListChecks", title: "Inbox (Pending)", pathname: "/sdo/review/inbox" },
          { icon: "CornerDownRight", title: "Forward to XEN", pathname: "/sdo/review/forward" },
          { icon: "PauseCircle", title: "Hold / Cancel", pathname: "/sdo/review/hold-cancel" },
          { icon: "Undo2",       title: "Request Changes", pathname: "/sdo/review/request-changes" },
        ],
      },

      // 3) XEN Approval
      {
        icon: "CheckCircle2",
        title: "XEN Approval",
        subMenu: [
          { icon: "Inbox",     title: "Queue",          pathname: "/xen/approvals/queue" },
          { icon: "ThumbsUp",  title: "Approve (→ PDC)", pathname: "/xen/approvals/approve" },
          { icon: "ThumbsDown",title: "Reject (→ SDO)",  pathname: "/xen/approvals/reject" },
          { icon: "Undo2",     title: "Request Changes", pathname: "/xen/approvals/request-changes" },
        ],
      },

      // 4) PDC Review & PTW Issuance
      {
        icon: "Stamp",
        title: "PDC – Issue PTW",
        subMenu: [
          { icon: "Inbox",     title: "Review Queue", pathname: "/pdc/review/queue" },
          { icon: "ClipboardCheck", title: "Issue PTW", pathname: "/pdc/issue" },
          { icon: "Reply",     title: "Return (→ XEN/SDO)", pathname: "/pdc/return" },
        ],
      },

      // 5) Grid Incharge – Pre-Execution
      {
        icon: "Wrench",
        title: "Grid – Pre-Execution",
        subMenu: [
          { icon: "ListChecks", title: "Safety Checklist", pathname: "/grid/pre-execution/checklist" },
          { icon: "Power",      title: "Activate PTW",     pathname: "/grid/pre-execution/activate" },
          { icon: "MessageSquareWarning", title: "Request Fixes", pathname: "/grid/pre-execution/request-fixes" },
        ],
      },

      // 6) Execution – LS & Crew (Mobile)
      {
        icon: "PlayCircle",
        title: "Execution (LS & Crew)",
        subMenu: [
          { icon: "Play",       title: "Pre-Start",        pathname: "/exec/pre-start" },   // PPE, Roster, Toolbox Talk
          { icon: "Activity",   title: "Work In Progress", pathname: "/exec/in-progress" }, // Notes, Pause/Resume, Suspend, Extension, Incident
          { icon: "CheckSquare",title: "Completion",       pathname: "/exec/completion" },  // Checklist + Evidence L3
        ],
      },

      // 7) Grid Incharge – Final Clearance
      {
        icon: "BadgeCheck",
        title: "Final Clearance",
        subMenu: [
          { icon: "ListChecks", title: "Final Checklist", pathname: "/grid/final-clearance/checklist" },
          { icon: "Power",      title: "Close PTW",       pathname: "/grid/final-clearance/close" },
          { icon: "RotateCw",   title: "Return for Fixes", pathname: "/grid/final-clearance/return" },
        ],
      },

      // Supporting Modules
    ],
  },
  {
    icon: "AlertTriangle",
    title: "Incidents & CAPA",
    subMenu: [
      { icon: "Flag",    title: "Report Incident", pathname: "/incidents/report" },
      { icon: "Search",  title: "Investigation",   pathname: "/incidents/investigation" },
      { icon: "Target",  title: "CAPA Actions",    pathname: "/capa" },
    ],
  },
  {
    icon: "BarChart3",
    title: "Reports",
    subMenu: [
      { icon: "Gauge",     title: "KPI Cards", pathname: "/reports/kpis" },
      { icon: "BarChart3", title: "Charts",    pathname: "/reports/charts" },
      { icon: "Download",  title: "Exports",   pathname: "/reports/exports" },
      { icon: "Filter",    title: "Filters",   pathname: "/reports/filters" },
    ],
  },
  {
    icon: "Shield",
    title: "Logs",
    subMenu: [
      { icon: "Image",     title: "Evidence Store", pathname: "/evidence" },
      { icon: "ClipboardList", title: "Audit Trail",  pathname: "/audit" },
    ],
  },
  
  "divider",
  {
    icon: "Settings2",
    title: "Masters",
    subMenu: [
      { icon: "Database",  title: "Assets Registry", pathname: "/admin/assets" },
      { icon: "FileText",  title: "Templates",       pathname: "/admin/templates" },
      { icon: "Sliders",   title: "Rules Engine",    pathname: "/admin/rules" },
      { icon: "KeySquare", title: "Permissions",     pathname: "/roles" },
    ],
  },

  
];

export default menu;
