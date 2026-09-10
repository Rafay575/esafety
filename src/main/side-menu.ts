// config/menu.ts
import { type Menu } from "@/stores/menuSlice";

// Get user from localStorage
const getUserFromStorage = () => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("auth_user");
  return userStr ? JSON.parse(userStr) : null;
};

const user = getUserFromStorage();
const isAdmin = user?.roles?.includes("Admin") || false;
const isMepcoIT = user?.roles?.includes("MepcoIT") || false;
const hasUserViewPermission =
  user?.permissions?.includes("users.view.any") || false;
const hasPostingViewPermission =
  user?.permissions?.includes("users.view.posting") || false;
const hasReportingViewPermission =
  user?.permissions?.includes("reports.view.esaftyPerformance") || false;

const menu: Array<Menu | "divider"> = [
  { icon: "Home", title: "Dashboard", pathname: "/" },
];

// Users
if (hasUserViewPermission) {
  menu.push({ icon: "Users", title: "Users", pathname: "/users" });
}

// User Posting
if (hasPostingViewPermission) {
  menu.push({
    icon: "SignpostBig",
    title: "User Posting",
    pathname: "/users-posting",
  });
}

// E-Safety (PTW)
menu.push({
  icon: "FileType2",  // changed from "FileType" to "FileType2" (more common in Lucide)
  title: "E-Safety (PTW)",
  ignore: true,
  subMenu: [
    {
      icon: "Activity",
      title: "LS – PJRA + PTW",
      pathname: "/pjra-ptw",
      ignore: true,
    },
  ],
});

// Divider
if (isAdmin && (hasUserViewPermission || hasPostingViewPermission)) {
  menu.push("divider");
}

// Reports
if (isAdmin || hasReportingViewPermission) {
  menu.push({
    icon: "BarChart3",  // changed from "BarChart" to "BarChart3" (standard Lucide)
    title: "Reports",
   subMenu: [
  {
    icon: "Gauge",               // Esafety Performance
    title: "Esafety Performance",
    pathname: "/reports/esafety-performance",
  },
  {
    icon: "AlertTriangle",       // Emergent PTW Report
    title: "Emergent PTW Report",
    pathname: "/reports/emergent-ptwreport",
  },
  {
    icon: "Clock",               // PTW Delay Report
    title: "PTW Delay Report",
    pathname: "/reports/ptwdelay-report",
  },
  {
    icon: "PieChart",            // PTW Type-Wise Report
    title: "PTW Type-Wise Report",
    pathname: "/reports/ptwtype-wise",
  },
],
  });
}

// Admin-only items
if (isAdmin) {
  menu.push({
    icon: "History",      // changed from "Activity" to "History" (more appropriate for logs)
    title: "Activity",
    pathname: "/activity-logs",
  });
  menu.push({
    icon: "Radio",        // changed from "Activity" to "Radio" (sessions)
    title: "Sessions",
    pathname: "/sessions",
  });
}

// Organization (Admin or MepcoIT)
if (isAdmin || isMepcoIT) {
  menu.push({
    icon: "Building2",
    title: "Organization",
    subMenu: [
      { icon: "Map", title: "Regions", pathname: "/organization/regions" },
      { icon: "Circle", title: "Circles", pathname: "/organization/circles" },
      { icon: "Layers", title: "Divisions", pathname: "/organization/divisions" },
      { icon: "GitBranch", title: "Sub-Divisions", pathname: "/organization/subdivisions" },
      { icon: "Zap", title: "Feeders", pathname: "/organization/feeders" },
      { icon: "TowerControl", title: "Transformer", pathname: "/organization/transformer" }, // changed from "Antenna" to "TowerControl" (more fitting)
      { icon: "Grid3x3", title: "Grid", pathname: "/organization/grid" }, // changed from "Grid" to "Grid3x3" (valid Lucide)
    ],
  });
}

export default menu;