import ThemeSwitcher from "@/components/ThemeSwitcher";
import logoUrl from "/main.png";
import illustrationUrl from "@/assets/images/illustration.svg";

import clsx from "clsx";
import AuthFlow from "../AuthFlow";
function Main() {
  return (
    <>
      <div
        className={clsx([
          "p-3 sm:px-8 relative h-screen lg:overflow-hidden bg-primary xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
          "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-primary/20 before:rounded-[100%] before:dark:bg-darkmode-400",
          "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:bg-primary after:rounded-[100%] after:dark:bg-darkmode-700",
        ])}
      >
        <ThemeSwitcher />
        <div className="container relative z-10 sm:px-10">
          <div className="block grid-cols-2 gap-4 xl:grid">
            {/* BEGIN: Login Info */}
            <div className="flex-col hidden min-h-screen xl:flex">
              <a href="" className="flex items-center pt-5 -intro-x">
                <img
                  alt="Midone Tailwind HTML Admin Template"
                  className="h-12"
                  src={logoUrl}
                />
              </a>
              <div className="my-auto">
                <img
                  alt="Midone Tailwind HTML Admin Template"
                  className="w-1/2 -mt-16 -intro-x"
                  src={illustrationUrl}
                />
                <div className="mt-10 text-4xl font-medium leading-tight text-white -intro-x">
                  A few more clicks to <br />
                  sign in to your account.
                </div>
                <div className="mt-5 text-lg text-white -intro-x text-opacity-70 dark:text-slate-400">
                  Manage all your e-commerce accounts in one place
                </div>
              </div>
            </div>
            {/* END: Login Info */}
            {/* BEGIN: Login Form */}
            <div className="flex h-screen py-5 my-10 xl:h-auto xl:py-0 xl:my-0 justify-center items-center intro-x">
              <div className="relative w-full max-w-md px-6 py-8 mx-auto bg-white/95 dark:bg-darkmode-700 backdrop-blur-sm border border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg xl:ml-20 xl:bg-white dark:xl:bg-darkmode-600 transition-all duration-300">
                {/* Header Branding */}
                <div className="text-center mb-6">
                  <img
                    src={"/logo.png"}
                    alt="MEPCO e-Safety Logo"
                    className="w-auto h-14 mx-auto mb-3 drop-shadow-md"
                  />
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    MEPCO e-Safety Portal
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Secure Access for Authorized Personnel
                  </p>
                </div>

                {/* Form */}
               <AuthFlow />
                {/* Divider */}
                <div className="flex items-center my-5">
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                  <span className="mx-3 text-xs text-slate-400">or</span>
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                </div>

                {/* Safety Message */}
                <div className="text-center text-slate-500 dark:text-slate-400 text-xs leading-snug">
                  🔒 Access restricted to authorized MEPCO employees only. All
                  activity is monitored for security and compliance.
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  © {new Date().getFullYear()} MEPCO e-Safety — Powered by{" "}
                 <span
  className="text-primary font-bold cursor-pointer"
  onClick={() => window.open("https://hrpsp.net", "_blank")}
>
  HRPSP
</span>

                </div>
              </div>
            </div>

            {/* END: Login Form */}
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
