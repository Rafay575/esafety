// src/components/ActivityTokenButton.tsx
import React, { useMemo, useState } from "react";
import { api } from "@/lib/axios";
import Button from "../Base/Button";
import Lucide from "@/components/Base/Lucide";

type ActivityTokenResponse = {
  success: boolean;
  token: string;
  expires_at: string;
};

type Props = {
  openUrlAfter?: boolean;
  activityLogBaseUrl?: string;
  buttonText?: string;
};

export default function ActivityTokenButton({
  openUrlAfter = true,
  activityLogBaseUrl = "https://mepco.myflexihr.com/activitylog-ui",
  buttonText = "Open Activity Log",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ActivityTokenResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const expiresLabel = useMemo(() => {
    if (!data?.expires_at) return "";
    try {
      return new Date(data.expires_at).toLocaleString();
    } catch {
      return data.expires_at;
    }
  }, [data?.expires_at]);

  const handleCopy = async () => {
    if (!data?.token) return;
    try {
      await navigator.clipboard.writeText(data.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const handleClick = async () => {
    setError("");
    setData(null);
    setCopied(false);
    setShowToken(false);

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("auth_token not found in localStorage.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        "https://mepco.myflexihr.com/api/generate-activitylog-url"
      );
      const payload = response.data; // expected: { url: string, token?: string, expires_at?: string }

      // ✅ If backend returns url only, we keep your current behavior.
      if (payload?.url) window.open(payload.url, "_blank");

      // Optional: if backend also returns token + expires_at, show the card too
      if (payload?.token && payload?.expires_at) {
        setData({
          success: true,
          token: payload.token,
          expires_at: payload.expires_at,
        });
      }
    } catch (err: any) {
      console.error("Error opening activity log:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong while generating the Activity Log URL."
      );
    } finally {
      setLoading(false);
    }
  };

  const tokenLink =
    data?.token
      ? `${activityLogBaseUrl}?token=${encodeURIComponent(data.token)}`
      : "";

  return (
    <div className="mt-5">
      {/* Wrapper Card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Lucide icon="Activity" className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-1">
              <div className="text-base font-semibold text-slate-900">
                Activity Log
              </div>
              <div className="text-sm text-slate-500">
                Generate a secure link and open the activity log in a new tab.
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500 border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Secure access
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              as="button"
              variant="primary"
              onClick={handleClick}
              disabled={loading}
              className={[
                "w-full sm:w-auto",
                "rounded-xl px-5 py-3 font-medium",
                "shadow-sm",
                loading ? "opacity-80 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lucide icon="ExternalLink" className="h-4 w-4" />
                    {buttonText}
                  </>
                )}
              </span>
            </Button>

            <div className="text-xs text-slate-500 leading-relaxed">
              Opens in a new tab. Token expires automatically.
            </div>
          </div>

          {/* Error */}
          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
                  <Lucide icon="AlertTriangle" className="h-5 w-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-rose-700">
                    Couldn’t open Activity Log
                  </div>
                  <div className="text-sm text-rose-700/80 mt-1">{error}</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Success Card (only shows if backend returns token+expires) */}
          {data ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <Lucide icon="CheckCircle2" className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Token generated
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      Expires: <span className="font-medium">{expiresLabel}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Lucide icon={showToken ? "EyeOff" : "Eye"} className="h-4 w-4" />
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>

              {/* Token field */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    TOKEN
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    <Lucide icon={copied ? "Check" : "Copy"} className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mt-2 font-mono text-sm text-slate-800 break-all">
                  {showToken ? data.token : "••••••••••••••••••••••••••••••••"}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                  href={tokenLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Lucide icon="ExternalLink" className="h-4 w-4" />
                  Open Activity Log
                </a>

                <button
                  type="button"
                  onClick={() => setData(null)}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Lucide icon="X" className="h-4 w-4" />
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          {/* Tiny footer */}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
            <span>Activity log access uses a signed URL.</span>
            <span className="hidden sm:inline">Flexi HR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
