// config/menu.ts
import { type Menu } from "@/stores/menuSlice";

// Get user from localStorage
const getUserFromStorage = () => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("auth_user");
  return userStr ? JSON.parse(userStr) : null;
};

const user = getUserFromStorage();
const isAdmin =  user?.roles?.includes("Admin") || false;
const hasUserViewPermission = user?.permissions?.includes("users.view.any") || false;
const hasPostingViewPermission = user?.permissions?.includes("users.view.posting") || false;

// Start building the menu
const menu: Array<Menu | "divider"> = [
  { icon: "Home", title: "Dashboard", pathname: "/" },
];

// Add Users if user has permission
if (hasUserViewPermission) {
  menu.push({ icon: "User", title: "Users", pathname: "/users" });
}

// Add User Posting if user has permission
if (hasPostingViewPermission) {
  menu.push({ icon: "SignpostBig", title: "User Posting", pathname: "/users-posting" });
}

// Add E-Safety menu (always visible for now)

  menu.push({
    icon: "FileType",
    title: "E-Safety (PTW)",
    subMenu: [
      { icon: "Activity", title: "LS – PJRA + PTW", pathname: "/pjra-ptw" },
    ],
  });

// Add divider if we have items before Organization
if (isAdmin && (hasUserViewPermission || hasPostingViewPermission)) {
  menu.push("divider");
}

// Add Organization menu if user is admin
if (isAdmin) {
  menu.push({
    icon: "Building2",
    title: "Organization",
    subMenu: [
      { icon: "Map", title: "Regions", pathname: "/organization/regions" },
      { icon: "Circle", title: "Circles", pathname: "/organization/circles" },
      { icon: "Layers", title: "Divisions", pathname: "/organization/divisions" },
      { icon: "GitBranch", title: "Sub-Divisions", pathname: "/organization/subdivisions" },
      { icon: "Zap", title: "Feeders", pathname: "/organization/feeders" },
      { icon: "Antenna", title: "Transformer", pathname: "/organization/transformer" },
      { icon: "Zap", title: "Grid", pathname: "/organization/grid" },
    ],
  });
}

export default menu;