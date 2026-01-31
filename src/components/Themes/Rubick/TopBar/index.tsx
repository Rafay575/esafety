import { useState, Fragment } from "react";
import Lucide from "@/components/Base/Lucide";
import Breadcrumb from "@/components/Base/Breadcrumb";
import { Menu, Popover } from "@/components/Base/Headless";
import _ from "lodash";
import { useDispatch } from "react-redux";
import { logout } from "@/stores/authSlice";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

function Main() {
  const [searchDropdown, setSearchDropdown] = useState(false);
  const showSearchDropdown = () => {
    setSearchDropdown(true);
  };
  const hideSearchDropdown = () => {
    setSearchDropdown(false);
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handlelogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  return (
    <>
      {/* BEGIN: Top Bar */}
      <div className="h-[67px] z-[51] flex items-center relative border-b border-slate-200">
        {/* BEGIN: Breadcrumb */}
        <Breadcrumb className="hidden mr-auto -intro-x sm:flex">
          <Breadcrumb.Link to="/">Application</Breadcrumb.Link>
          <Breadcrumb.Link to="/" active={true}>
            Dashboard
          </Breadcrumb.Link>
        </Breadcrumb>
        {/* END: Breadcrumb */}
        {/* BEGIN: Search */}

        <Menu>
          <Menu.Button className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-slate-200 zoom-in intro-x">
            <User className="w-4 h-4 text-slate-600" />
          </Menu.Button>

          <Menu.Items className="w-56 mt-px text-white bg-primary">
            {/* <Menu.Item className="hover:bg-white/5">
              <Lucide icon="User" className="w-4 h-4 mr-2" /> Profile
            </Menu.Item>
            <Menu.Item className="hover:bg-white/5">
              <Lucide icon="FilePenLine" className="w-4 h-4 mr-2" /> Add Account
            </Menu.Item>
            <Menu.Item className="hover:bg-white/5">
              <Lucide icon="Lock" className="w-4 h-4 mr-2" /> Reset Password
            </Menu.Item>
            <Menu.Item className="hover:bg-white/5">
              <Lucide icon="HelpCircle" className="w-4 h-4 mr-2" /> Help
            </Menu.Item>
            <Menu.Divider className="bg-white/[0.08]" /> */}
            <button onClick={handlelogout} className="w-full">
              <Menu.Item className="hover:bg-white/10">
                <Lucide icon="ToggleRight" className="w-6 h-6 mr-2" /> Logout
              </Menu.Item>
            </button>
          </Menu.Items>
        </Menu>
      </div>
      {/* END: Top Bar */}
    </>
  );
}

export default Main;
