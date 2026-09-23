import "@/assets/css/themes/rubick/side-nav.css";
import { Transition } from "react-transition-group";
import { useState, useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FormattedMenu,
  linkTo,
  nestedMenu,
  enter,
  leave,
  forceActiveMenuContext,
  forceActiveMenu,
} from "./side-menu";
import { buildMenu } from "@/main/side-menu";
import Tippy from "@/components/Base/Tippy";
import Lucide from "@/components/Base/Lucide";
import logoUrl from "/logo.png";
import clsx from "clsx";
import TopBar from "@/components/Themes/Rubick/TopBar";
import MobileMenu from "@/components/MobileMenu";

const SIDEBAR_KEY = "sidebar-hidden";

// false -> every group (menu item with children) starts collapsed and only opens when clicked
// true  -> the group that contains the page you are on opens automatically
const AUTO_OPEN_ACTIVE_GROUP = false;

// Shown in tooltips / next to the button: "⌘B" on Mac, "Ctrl+B" elsewhere
const SHORTCUT_LABEL =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent)
    ? "⌘B"
    : "Ctrl+B";

/**
 * Applies the user's expand/collapse choices to the formatted menu.
 * A group is identified by its title path, e.g. "Reports" or "Reports/Esafety Performance".
 */
const applyOpenState = (
  items: Array<FormattedMenu | "divider">,
  open: Set<string>,
  parentKey = ""
): Array<FormattedMenu | "divider"> =>
  items.map((item) => {
    if (typeof item === "string") return item;
    if (!item.subMenu) return item;

    const key = parentKey ? `${parentKey}/${item.title}` : item.title;
    return {
      ...item,
      activeDropdown:
        open.has(key) || (AUTO_OPEN_ACTIVE_GROUP && !!item.activeDropdown),
      subMenu: applyOpenState(item.subMenu, open, key) as FormattedMenu[],
    };
  });

function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);

  // Groups the user has opened. Empty = everything collapsed (the default).
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  // Menu for the CURRENT user (based on their roles / permissions in localStorage).
  // It is built when this layout mounts (i.e. right after login) and on every route
  // change, so it can never be a stale copy from before the user logged in.
  const menuItems = useMemo(() => buildMenu(), [location.pathname]);
  const menu = () => nestedMenu(menuItems, location);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Sidebar hide/show state (remembered across page reloads)
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => setSidebarHidden((prev) => !prev);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarHidden));
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [sidebarHidden]);

  // Keyboard shortcut like desktop apps: Ctrl+B (Windows/Linux) or ⌘B (Mac)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "b") return;
      if (window.innerWidth < 768) return; // no sidebar on mobile

      // Don't hijack the shortcut while typing (e.g. "bold" in a text editor)
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      setSidebarHidden((prev) => !prev);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Rebuild the formatted menu whenever the menu items / route / opened groups change
  useEffect(() => {
    setFormattedMenu(applyOpenState(menu(), openGroups));
  }, [menuItems, openGroups]);

  // Track window width (registered once, cleaned up on unmount)
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // groupKey is passed for items that have children (title path, see applyOpenState)
  const handleMenuClick =
    (item: any, groupKey?: string) => (event: React.MouseEvent) => {
      // External link -> open in a new tab
      if (item?.url) {
        event.preventDefault();
        event.stopPropagation();
        window.open(item.url, "_blank", "noopener,noreferrer");
        return;
      }

      event.preventDefault();

      // Item with children -> just expand / collapse it
      if (item?.subMenu && groupKey) {
        toggleGroup(groupKey);
        return;
      }

      // Normal internal navigation
      linkTo(item, navigate);
      setFormattedMenu([...formattedMenu]);
    };

  return (
    <forceActiveMenuContext.Provider
      value={{
        forceActiveMenu: (pathname) => {
          forceActiveMenu(location, pathname);
          setFormattedMenu(applyOpenState(menu(), openGroups));
        },
      }}
    >
      <div
        className={clsx([
          "rubick px-5 sm:px-8 py-5",
          "before:content-[''] before:bg-gradient-to-b before:from-theme-1 before:to-theme-2 dark:before:from-darkmode-800 dark:before:to-darkmode-800 before:fixed before:inset-0 before:z-[-1]",
        ])}
      >
        <MobileMenu />
        <div className="flex mt-[4.7rem] md:mt-0">
          {/* BEGIN: Side Menu */}
          {/* Sticky, full-height column: menu scrolls in the middle, collapse control stays pinned at the bottom */}
          <nav
            className={clsx([
              "side-nav hidden w-[80px] overflow-x-hidden xl:w-[230px]",
              "sticky top-5 h-[calc(100vh_-_2.5rem)] self-start",
              !sidebarHidden && "md:flex md:flex-col",
            ])}
          >
            {/* Scrollable menu area */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-10 pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link to="/" className="flex items-center pt-4 pl-5 intro-x">
                <img
                  alt="Midone Tailwind HTML Admin Template"
                  className="w-6"
                  src={logoUrl}
                />
                <span className="hidden ml-3 text-lg text-white xl:block">
                  E-safety
                </span>
              </Link>
              <div className="my-6 side-nav__divider"></div>
              <ul>
                {/* BEGIN: First Child */}
                {formattedMenu.map((menu, menuKey) =>
                  menu == "divider" ? (
                    <li className="my-6 side-nav__divider" key={menuKey}></li>
                  ) : (
                    <li key={menuKey} className="intro-y">
                      <Tippy
                        as="a"
                        content={menu.title}
                        options={{ placement: "right" }}
                        disable={windowWidth > 1260}
                        href={
                          menu.url ? menu.url : menu.subMenu ? "#" : menu.pathname
                        }
                        target={menu.url ? "_blank" : undefined}
                        rel={menu.url ? "noopener noreferrer" : undefined}
                        onClick={handleMenuClick(menu, menu.title)}
                        className={clsx([
                          menu.active ? "side-menu side-menu--active" : "side-menu",
                        ])}
                      >
                        <div className="side-menu__icon">
                          <Lucide icon={menu.icon} />
                        </div>
                        <div className="side-menu__title">
                          {menu.title}
                          {menu.subMenu && (
                            <div
                              className={clsx([
                                "side-menu__sub-icon",
                                { "transform rotate-180": menu.activeDropdown },
                              ])}
                            >
                              <Lucide icon="ChevronDown" />
                            </div>
                          )}
                        </div>
                      </Tippy>

                      {/* BEGIN: Second Child */}
                      {menu.subMenu && (
                        <Transition
                          in={menu.activeDropdown}
                          onEnter={enter}
                          onExit={leave}
                          timeout={300}
                        >
                          <ul
                            className={clsx({
                              "side-menu__sub-open": menu.activeDropdown,
                            })}
                          >
                            {menu.subMenu.map((subMenu, subMenuKey) => (
                              <li key={subMenuKey}>
                                <Tippy
                                  as="a"
                                  content={subMenu.title}
                                  options={{ placement: "right" }}
                                  disable={windowWidth > 1260}
                                  href={
                                    subMenu.url
                                      ? subMenu.url
                                      : subMenu.subMenu
                                      ? "#"
                                      : subMenu.pathname
                                  }
                                  target={subMenu.url ? "_blank" : undefined}
                                  rel={
                                    subMenu.url ? "noopener noreferrer" : undefined
                                  }
                                  onClick={handleMenuClick(
                                    subMenu,
                                    `${menu.title}/${subMenu.title}`
                                  )}
                                  className={clsx([
                                    subMenu.active
                                      ? "side-menu side-menu--active"
                                      : "side-menu",
                                    // Children are more compact than their parent
                                    "!h-10",
                                  ])}
                                >
                                  {/* xl:!ml-3 = indent children a bit more than the parent */}
                                  <div className="side-menu__icon xl:!ml-3">
                                    <Lucide
                                      icon={subMenu.icon}
                                      className="!h-4 !w-4"
                                    />
                                  </div>
                                  <div className="side-menu__title !text-[13px]">
                                    {subMenu.title}
                                    {subMenu.subMenu && (
                                      <div
                                        className={clsx([
                                          "side-menu__sub-icon",
                                          {
                                            "transform rotate-180":
                                              subMenu.activeDropdown,
                                          },
                                        ])}
                                      >
                                        <Lucide icon="ChevronDown" />
                                      </div>
                                    )}
                                  </div>
                                </Tippy>

                                {/* BEGIN: Third Child */}
                                {subMenu.subMenu && (
                                  <Transition
                                    in={subMenu.activeDropdown}
                                    onEnter={enter}
                                    onExit={leave}
                                    timeout={300}
                                  >
                                    <ul
                                      className={clsx({
                                        "side-menu__sub-open":
                                          subMenu.activeDropdown,
                                      })}
                                    >
                                      {subMenu.subMenu.map(
                                        (lastSubMenu, lastSubMenuKey) => (
                                          <li key={lastSubMenuKey}>
                                            <Tippy
                                              as="a"
                                              content={lastSubMenu.title}
                                              options={{ placement: "right" }}
                                              disable={windowWidth > 1260}
                                              href={
                                                lastSubMenu.url
                                                  ? lastSubMenu.url
                                                  : lastSubMenu.subMenu
                                                  ? "#"
                                                  : lastSubMenu.pathname
                                              }
                                              target={
                                                lastSubMenu.url
                                                  ? "_blank"
                                                  : undefined
                                              }
                                              rel={
                                                lastSubMenu.url
                                                  ? "noopener noreferrer"
                                                  : undefined
                                              }
                                              onClick={handleMenuClick(lastSubMenu)}
                                              className={clsx([
                                                lastSubMenu.active
                                                  ? "side-menu side-menu--active"
                                                  : "side-menu",
                                                "!h-9",
                                              ])}
                                            >
                                              <div className="side-menu__icon xl:!ml-6">
                                                <Lucide
                                                  icon={lastSubMenu.icon}
                                                  className="!h-4 !w-4"
                                                />
                                              </div>
                                              <div className="side-menu__title !text-[12px]">
                                                {lastSubMenu.title}
                                              </div>
                                            </Tippy>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </Transition>
                                )}
                                {/* END: Third Child */}
                              </li>
                            ))}
                          </ul>
                        </Transition>
                      )}
                      {/* END: Second Child */}
                    </li>
                  )
                )}
                {/* END: First Child */}
              </ul>
            </div>

            {/* BEGIN: Sidebar footer – collapse control pinned to the bottom */}
            <div className="shrink-0 pr-5 bottom-0 fixed pb-3">
              <div className="mb-0 side-nav__divider"></div>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                title={`Collapse sidebar (${SHORTCUT_LABEL})`}
                className="group flex w-full items-center justify-center gap-3 rounded-lg py-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white xl:justify-start xl:px-5"
              >
                <Lucide icon="PanelLeftClose" className="h-[18px] w-[18px] shrink-0" />
                <span className="hidden text-sm xl:block">Collapse</span>
                <kbd className="ml-auto hidden rounded border border-white/20 px-1.5 py-0.5 font-sans text-[10px] text-white/50 transition-colors group-hover:border-white/40 group-hover:text-white/80 xl:block">
                  {SHORTCUT_LABEL}
                </kbd>
              </button>
            </div>
            {/* END: Sidebar footer */}
          </nav>
          {/* END: Side Menu */}

          {/* Slim strip shown while the sidebar is hidden – keeps the expand button in the same bottom-left spot */}
          {sidebarHidden && (
            <div className="sticky top-5 hidden h-[calc(100vh_-_2.5rem)] w-9 shrink-0 self-start pb-2 md:flex md:flex-col md:justify-end mr-3">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Show sidebar"
                title={`Show sidebar (${SHORTCUT_LABEL})`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Lucide icon="PanelLeftOpen" className="h-[18px] w-[18px] " />
              </button>
            </div>
          )}

          {/* BEGIN: Content */}
          <div className="md:max-w-auto min-h-screen min-w-0 max-w-full flex-1 rounded-[30px] bg-slate-100 px-4 pb-10 before:block before:h-px before:w-full before:content-[''] dark:bg-darkmode-700 md:px-[22px]">
            <TopBar />
            <Outlet />
          </div>
          {/* END: Content */}
        </div>
      </div>
    </forceActiveMenuContext.Provider>
  );
}

export default Main;