import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { type Themes } from "@/stores/themeSlice";
import { icons } from "@/components/Base/Lucide";
import { buildMenu } from "@/main/side-menu";
import simpleMenu from "@/main/simple-menu";
import topMenu from "@/main/top-menu";

export interface Menu {
  icon: keyof typeof icons;
  title: string;
  badge?: number;
  pathname?: string;
  subMenu?: Menu[];
  ignore?: boolean;
  url?: string;
}

export interface MenuState {
  menu: Array<Menu | string>;
}

const initialState: MenuState = {
  menu: [],
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
});

/**
 * The side menu depends on who is logged in, so it is rebuilt whenever the stored
 * user changes (login / logout / switching account) – no page reload needed.
 *
 * It is cached by the stored user string so the SAME array is returned between calls.
 * (Returning a brand-new array on every call would make useAppSelector treat it as a
 * change each time and re-render constantly.)
 */
let cachedUserKey: string | null = null;
let cachedSideMenu: ReturnType<typeof buildMenu> = [];

const getSideMenu = () => {
  let userKey = "";
  try {
    userKey = localStorage.getItem("auth_user") ?? "";
  } catch {
    // ignore storage errors
  }

  if (userKey !== cachedUserKey) {
    cachedUserKey = userKey;
    cachedSideMenu = buildMenu();
  }
  return cachedSideMenu;
};

export const selectMenu = (layout: Themes["layout"]) => (state: RootState) => {
  if (layout == "top-menu") {
    return topMenu;
  }

  if (layout == "simple-menu") {
    return simpleMenu;
  }

  return getSideMenu();
};

export default menuSlice.reducer;