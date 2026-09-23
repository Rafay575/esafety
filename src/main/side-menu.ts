// main/side-menu.ts
import { type Menu } from "@/stores/menuSlice";

type AuthUser = {
  roles?: string[];
  permissions?: string[];
} | null;

// Read the logged-in user from localStorage (safe against bad / missing JSON)
const getUserFromStorage = (): AuthUser => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Builds the sidebar menu for the CURRENT user.
 *
 * This is a function on purpose: it must run every time the menu is needed
 * (initial load, after login, after logout). If the menu were built at the top
 * level of this file it would be computed only once, when the app first loads
 * (before anyone has logged in), and would never update until a page reload.
 */
export const buildMenu = (): Array<Menu | "divider"> => {
  const user = getUserFromStorage();

  const hasRole = (role: string) => !!user?.roles?.includes(role);
  const hasPermission = (permission: string) => !!user?.permissions?.includes(permission);

  const isAdmin = hasRole("Admin");
  const isMepcoIT = hasRole("MepcoIT");
  const hasUserViewPermission = hasPermission("users.view.any");
  const hasPostingViewPermission = hasPermission("users.view.posting");
  const hasReportingViewPermission = hasPermission("reports.view.esaftyPerformance");

  const menu: Array<Menu | "divider"> = [
    { icon: "LayoutDashboard", title: "Dashboard", pathname: "/" },
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
    icon: "ShieldCheck",
    title: "E-Safety (PTW)",
    ignore: true,
    subMenu: [
      {
        icon: "ClipboardCheck",
        title: "LS – PJRA + PTW",
        pathname: "/pjra-ptw",
        ignore: true,
      },
    ],
  });

  menu.push({
    icon: "ListChecks",
    title: "Action Queue",
    ignore: true,
    pathname: "/action-queue",
  });

  menu.push({
    icon: "Activity",
    title: "Recent Activity",
    ignore: true,
    pathname: "/recent-activity",
  });

  // Divider
  if (isAdmin && (hasUserViewPermission || hasPostingViewPermission)) {
    menu.push("divider");
  }

  // Reports
  if (isAdmin || hasReportingViewPermission) {
    menu.push({
      icon: "BarChart3",
      title: "Reports",
      subMenu: [
        { icon: "Gauge", title: "Esafety Performance", pathname: "/reports/esafety-performance" },
        { icon: "AlertTriangle", title: "Emergent PTW", pathname: "/reports/emergent-ptwreport" },
      
        { icon: "PieChart", title: "PTW Type-Wise", pathname: "/reports/ptwtype-wise" },
      ],
    });
  }

  // Admin-only items
  if (isAdmin) {
    menu.push({
      icon: "History",
      title: "Activity",
      pathname: "/activity-logs",
    });
    menu.push({
      icon: "MonitorSmartphone",
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
        { icon: "TowerControl", title: "Transformer", pathname: "/organization/transformer" },
        { icon: "Grid3x3", title: "Grid", pathname: "/organization/grid" },
      ],
    });
  }

  return menu;
};

// Kept only so any old `import sideMenu from "@/main/side-menu"` keeps compiling.
// Prefer buildMenu(): this value is computed once at import time and can be stale.
export default buildMenu();