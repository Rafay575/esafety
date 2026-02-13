import "@/assets/css/themes/rubick/side-nav.css";
import { Transition } from "react-transition-group";
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectMenu } from "@/stores/menuSlice";
import { useAppSelector } from "@/stores/hooks";
import {
  FormattedMenu,
  linkTo,
  nestedMenu,
  enter,
  leave,
  forceActiveMenuContext,
  forceActiveMenu,
} from "./side-menu";
import Tippy from "@/components/Base/Tippy";
import Lucide from "@/components/Base/Lucide";
import logoUrl from "/logo.png";
import clsx from "clsx";
import TopBar from "@/components/Themes/Rubick/TopBar";
import MobileMenu from "@/components/MobileMenu";

function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);
  const menuStore = useAppSelector(selectMenu("side-menu"));
  const menu = () => nestedMenu(menuStore, location);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
const openExternal = (url?: string) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};
  useEffect(() => {
    setFormattedMenu(menu());

    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });
  }, [menuStore, location.pathname]);
const handleMenuClick = (item: any) => async (event: React.MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  // ✅ Special handling for Activity Log (Admin only)
  if (item?.title === "Activity" || item?.pathname === "/activity-log") {
    try {
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        alert('Please login first');
        return;
      }

      // Show loading indicator (optional)
      // setLoading(true);

      // Generate temporary access token from backend
      const response = await fetch('https://mepco.myflexihr.com/api/v1/generate-activity-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Open activity log with temporary token
        const url = item?.url || "";
      if (typeof window !== "undefined") {
  window.open(url, "_blank", "noopener,noreferrer");
}

      } else {
        console.error('Failed to generate activity token:', data);
        alert('Failed to open activity logs. Please try again.');
      }
    } catch (error) {
      console.error('Error generating activity token:', error);
      alert('An error occurred while opening activity logs.');
    } finally {
      // setLoading(false);
    }
    return;
  }

  // ✅ External link -> open new tab
  if (item?.url) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }
  
  // ✅ Normal internal navigation
  linkTo(item, navigate);
  setFormattedMenu([...formattedMenu]);
};

  return (
    <forceActiveMenuContext.Provider
      value={{
        forceActiveMenu: (pathname) => {
          forceActiveMenu(location, pathname);
          setFormattedMenu(menu());
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
          <nav className="side-nav hidden w-[80px] overflow-x-hidden pb-16 pr-5 md:block xl:w-[230px]">
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
    <li key={menuKey}>
      <Tippy
        as="a"
        content={menu.title}
        options={{ placement: "right" }}
        disable={windowWidth > 1260}
        href={menu.url ? menu.url : menu.subMenu ? "#" : menu.pathname}
        target={menu.url ? "_blank" : undefined}
        rel={menu.url ? "noopener noreferrer" : undefined}
         onClick={handleMenuClick(menu)}
        className={clsx([menu.active ? "side-menu side-menu--active" : "side-menu"])}
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
        <Transition in={menu.activeDropdown} onEnter={enter} onExit={leave} timeout={300}>
          <ul className={clsx({ "side-menu__sub-open": menu.activeDropdown })}>
            {menu.subMenu.map((subMenu, subMenuKey) => (
              <li key={subMenuKey}>
                <Tippy
                  as="a"
                  content={subMenu.title}
                  options={{ placement: "right" }}
                  disable={windowWidth > 1260}
                  href={subMenu.url ? subMenu.url : subMenu.subMenu ? "#" : subMenu.pathname}
                  target={subMenu.url ? "_blank" : undefined}
                  rel={subMenu.url ? "noopener noreferrer" : undefined}
                 onClick={handleMenuClick(subMenu)}
                  className={clsx([subMenu.active ? "side-menu side-menu--active" : "side-menu"])}
                >
                  <div className="side-menu__icon">
                    <Lucide icon={subMenu.icon} />
                  </div>
                  <div className="side-menu__title">
                    {subMenu.title}
                    {subMenu.subMenu && (
                      <div
                        className={clsx([
                          "side-menu__sub-icon",
                          { "transform rotate-180": subMenu.activeDropdown },
                        ])}
                      >
                        <Lucide icon="ChevronDown" />
                      </div>
                    )}
                  </div>
                </Tippy>

                {/* BEGIN: Third Child */}
                {subMenu.subMenu && (
                  <Transition in={subMenu.activeDropdown} onEnter={enter} onExit={leave} timeout={300}>
                    <ul className={clsx({ "side-menu__sub-open": subMenu.activeDropdown })}>
                      {subMenu.subMenu.map((lastSubMenu, lastSubMenuKey) => (
                        <li key={lastSubMenuKey}>
                          <Tippy
                            as="a"
                            content={lastSubMenu.title}
                            options={{ placement: "right" }}
                            disable={windowWidth > 1260}
                            href={lastSubMenu.url ? lastSubMenu.url : lastSubMenu.subMenu ? "#" : lastSubMenu.pathname}
                            target={lastSubMenu.url ? "_blank" : undefined}
                            rel={lastSubMenu.url ? "noopener noreferrer" : undefined}
                           onClick={handleMenuClick(lastSubMenu)}
                            className={clsx([lastSubMenu.active ? "side-menu side-menu--active" : "side-menu"])}
                          >
                            <div className="side-menu__icon">
                              <Lucide icon={lastSubMenu.icon} />
                            </div>
                            <div className="side-menu__title">{lastSubMenu.title}</div>
                          </Tippy>
                        </li>
                      ))}
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
          </nav>
          {/* END: Side Menu */}
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
