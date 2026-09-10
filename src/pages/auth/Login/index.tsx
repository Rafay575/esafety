import ThemeSwitcher from "@/components/ThemeSwitcher";
import logoUrl from "/logo.png";
import clsx from "clsx";
import AuthFlow from "../AuthFlow";

const capabilities = [
  { icon: <ShieldIcon />, label: "Secure" },
  { icon: <DocumentIcon />, label: "Compliant" },
  { icon: <ChartIcon />, label: "Connected" },
  { icon: <UsersIcon />, label: "Accountable" },
];

function Main() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-darkmode-800">
      <ThemeSwitcher />

      {/* dot grid background across the whole page, like the inspiration */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(100,116,139,0.25) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative flex min-h-screen">
        {/* thin yellow curved border tracing the right/bottom edge of the panel */}
        <div
          className="hidden xl:block absolute inset-y-0 left-0 w-[calc(56%+8px)] bg-yellow-400"
          style={{ clipPath: "ellipse(100% 100% at 0% 30%)" }}
          aria-hidden="true"
        />

        {/* BEGIN: Left / Brand panel — its own element, curved right edge, NOT sharing a box with the right card */}
        <div
          className={clsx([
            "hidden xl:flex flex-col justify-between",
            "absolute inset-y-0 left-0 w-[56%] p-10",
            "overflow-hidden shadow-xl",
            "bg-gradient-to-br from-primary via-primary to-slate-900",
          ])}
          style={{ clipPath: "ellipse(100% 100% at 0% 30%)" }}
        >
          {/* background photo */}
          <img
            src={"/login-bg.png"}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-luminosity"
          />
          {/* color overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-transparent" />

          {/* logo badge */}
          <div className="relative z-10">
            <img
              alt="MEPCO e-Safety"
              className="h-24 w-24 rounded-full ring-4 ring-yellow-400 shadow-lg bg-white"
              src={logoUrl}
            />
          </div>

          {/* headline block */}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Safe People.
              <br />
              Safe Work.
              <br />
              <span className="text-yellow-400">Safe Communities.</span>
            </h1>

            <div className="mt-4 h-1 w-16 rounded-full bg-yellow-400" />

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">
              Digital Permit-to-Work and field safety management for a
              safer, more reliable distribution network.
            </p>
          </div>

          {/* capability row */}
          <div className="relative z-10 flex gap-4">
            {capabilities.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-400/60 text-yellow-400">
                  {item.icon}
                </div>
                <span className="text-xs font-medium text-white/90">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* END: Left / Brand panel */}

        {/* spacer so the right card's centering accounts for the left panel's width on xl screens */}
        <div className="hidden xl:block w-[56%] shrink-0" aria-hidden="true" />

        {/* BEGIN: Right / Login panel — its own floating card, independent shadow, sits on the dotted background */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-darkmode-600 shadow-2xl px-6 py-8 sm:px-10">
            {/* Header Branding */}
            <div className="text-center mb-6">
              <img
                src={logoUrl}
                alt="MEPCO e-Safety Logo"
                className="w-auto h-14 mx-auto mb-3 drop-shadow-md"
              />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                MEPCO <span className="text-orange-500">eSafety</span> Portal
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Secure access for authorized personnel only
              </p>
            </div>

            {/* Form (email/CNIC, password, remember me, sign in, forgot password) */}
            <AuthFlow />

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600" />
              <span className="mx-3 text-xs text-slate-400">or</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-600" />
            </div>

            {/* Biometric option */}
          

            {/* Safety Message */}
            <div className="mt-5 rounded-xl bg-slate-50 dark:bg-darkmode-700 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-primary flex items-center justify-center gap-1.5">
                <ShieldIcon className="h-4 w-4" />
                Your safety is our priority
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                All activities are monitored for security and compliance.
              </p>
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
        {/* END: Right / Login panel */}
      </div>
    </div>
  );
}

export default Main;

/* ---------------- Inline icons (swap for lucide-react if it's in your deps) ---------------- */

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" {...props}>
      <path d="M12 3l8 3v5c0 5-3.2 8.6-8 10-4.8-1.4-8-5-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}

function DocumentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" {...props}>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h4" />
      <path d="M9 13h6M9 17h5" />
    </svg>
  );
}

function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="m7 15 4-4 3 2 5-6" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6" />
      <path d="M15 15c3 0 5 1.7 5 5" />
    </svg>
  );
}

function FingerprintIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" {...props}>
      <path d="M12 3a7 7 0 0 0-7 7" />
      <path d="M19 10a7 7 0 0 0-13.5-2.5" />
      <path d="M8 12c0-2.3 1.7-4 4-4s4 1.7 4 4" />
      <path d="M10 12c0-1.2.8-2 2-2s2 .8 2 2c0 4-1.2 7-3.5 9" />
      <path d="M6 13c0 3.5-.8 5.5-2 7" />
      <path d="M18 13c0 3-.7 5.6-2.2 8" />
    </svg>
  );
}