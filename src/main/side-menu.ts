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
        pathname: "/pjra-ptw",
      },
    
      // Supporting Modules
    ],
  },
 
  
  "divider",
   {
    icon: "Building2",
    title: "Organization",
    subMenu: [
      { icon: "Map",        title: "Regions",        pathname: "/organization/regions" },
      { icon: "Circle",     title: "Circles",        pathname: "/organization/circles" },
      { icon: "Layers",     title: "Divisions",      pathname: "/organization/divisions" },
      { icon: "GitBranch",  title: "Sub-Divisions",  pathname: "/organization/subdivisions" },
      { icon: "Zap",        title: "Feeders",        pathname: "/organization/feeders" },
      // { icon: "Zap",        title: "Transformer",        pathname: "/organization/transformer" },
     
    ],
  },
 

  
];

export default menu;
