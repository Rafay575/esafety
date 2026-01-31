// utils/menuFilter.ts
import { type Menu } from "@/stores/menuSlice";

export interface UserData {
  avatar?: string;
  department?: string;
  designation?: string;
  email: string;
  id: number;
  name: string;
  permissions: string[];
  phone?: string;
  roles: string[];
  sap_code?: string;
}

export function filterMenuByUser(menu: Array<Menu | "divider">, user: UserData): Array<Menu | "divider"> {
  const filteredMenu: Array<Menu | "divider"> = [];
  
  // Check if user has admin role (assuming "MepcoIT" is admin role)
  const isAdmin = user.roles.includes("MepcoIT") || user.designation?.toLowerCase().includes("admin");
  
  // Check permissions
  const hasUserViewPermission = user.permissions.includes("users.view.any");
  const hasPostingViewPermission = user.permissions.includes("users.view.posting");

  for (const item of menu) {
    if (item === "divider") {
      // Keep dividers but we'll clean them up later
      filteredMenu.push(item);
      continue;
    }

    // Clone the item to avoid mutating original
    const menuItem = { ...item };

    // Check if menu item should be shown based on user role/permissions
    if (menuItem.title === "Users") {
      if (hasUserViewPermission) {
        filteredMenu.push(menuItem);
      }
      continue;
    }

    if (menuItem.title === "User Posting") {
      if (hasPostingViewPermission) {
        filteredMenu.push(menuItem);
      }
      continue;
    }

    if (menuItem.title === "Organization") {
      if (isAdmin) {
        filteredMenu.push(menuItem);
      }
      continue;
    }

    // For submenus, we need to filter their children too
    if (menuItem.subMenu) {
      const filteredSubMenu = menuItem.subMenu.filter(subItem => {
        // If this is a submenu of Organization, only show if user is admin
        if (menuItem.title === "Organization" && !isAdmin) {
          return false;
        }
        // Add more conditions for other submenus if needed
        return true;
      });

      // Only add menu item if it has submenus after filtering
      if (filteredSubMenu.length > 0) {
        filteredMenu.push({
          ...menuItem,
          subMenu: filteredSubMenu
        });
      }
      continue;
    }

    // For all other menu items, add them
    filteredMenu.push(menuItem);
  }

  // Clean up consecutive dividers
  return cleanupDividers(filteredMenu);
}

function cleanupDividers(menu: Array<Menu | "divider">): Array<Menu | "divider"> {
  const cleanedMenu: Array<Menu | "divider"> = [];
  
  for (let i = 0; i < menu.length; i++) {
    const current = menu[i];
    const prev = menu[i - 1];
    
    // Skip divider if it's the first item or previous item was also a divider
    if (current === "divider" && (i === 0 || prev === "divider")) {
      continue;
    }
    
    // Skip divider if it's the last item
    if (current === "divider" && i === menu.length - 1) {
      continue;
    }
    
    cleanedMenu.push(current);
  }
  
  return cleanedMenu;
}