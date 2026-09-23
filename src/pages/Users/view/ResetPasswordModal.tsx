"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { Loader } from "lucide-react";

interface ResetPasswordModalProps {
  open: boolean;
  userId: number | null;
  userName?: string;
  onClose: () => void;
  /** Called after a successful reset — pass the newly generated password, if any */
  onSuccess?: (info: {
    generated: boolean;
    newPassword: string | null;
    userEmail?: string;
  }) => void;
}

type Mode = "generate" | "custom";

export default function ResetPasswordModal({
  open,
  userId,
  userName,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const [mode, setMode] = useState<Mode>("generate");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result state (shown once, after a successful call)
  const [result, setResult] = useState<{
    generated: boolean;
    newPassword: string | null;
  } | null>(null);

  // Reset the whole modal whenever it opens
  useEffect(() => {
    if (open) {
      setMode("generate");
      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setSubmitting(false);
      setResult(null);
    }
  }, [open]);

  if (!open || !userId) return null;

  const validate = (): string | null => {
    if (mode === "custom") {
      if (!password) return "Password is required";
      if (password.length < 8) return "Password must be at least 8 characters";
      if (password !== confirm) return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // Payload: only send `password` when the user provided one.
      // Leave it out entirely for auto-generate mode.
      const payload: Record<string, any> = {};
      if (mode === "custom") {
        payload.password = password;
        payload.password_confirmation = confirm;
      }

      const { data } = await api.post(
        `/api/v1/users/${userId}/reset-password`,
        payload,
      );

      const generated = Boolean(data?.generated);
      const newPassword: string | null = data?.new_password ?? null;

      setResult({ generated, newPassword });

      toast.success(
        generated
          ? "Password generated. Copy it now — it won't be shown again."
          : "Password reset successfully.",
      );

      onSuccess?.({ generated, newPassword });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to reset password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.newPassword) return;
    try {
      await navigator.clipboard.writeText(result.newPassword);
      toast.success("Password copied to clipboard");
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const handleClose = () => {
    // If a generated password is showing, warn before closing
    if (result?.generated && result.newPassword) {
      const ok = window.confirm(
        "The generated password will be lost if you close this. Have you copied it?",
      );
      if (!ok) return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Lucide icon="KeyRound" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Reset Password
              </h3>
              {userName && (
                <p className="text-xs text-slate-500">for {userName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <Lucide icon="X" className="h-5 w-5" />
          </button>
        </div>

        {/* ───── RESULT VIEW ───── */}
        {result ? (
          <div className="mt-5 space-y-4">
            {result.generated && result.newPassword ? (
              <>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Generated password
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2">
                    <code className="select-all font-mono text-sm font-bold text-slate-900 break-all">
                      {result.newPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="ml-2 flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Copy password"
                    >
                      <Lucide icon="Copy" className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <Lucide
                    icon="AlertTriangle"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    <b>This password will not be shown again.</b> Copy it now
                    and share it with the user through a secure channel. All
                    their sessions have been revoked and they will need to log
                    in again with this password.
                  </span>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="flex items-center gap-2 font-semibold">
                  <Lucide icon="CheckCircle2" className="h-4 w-4" />
                  Password reset successfully
                </p>
                <p className="mt-1 text-xs">
                  Share the new password with the user through a secure
                  channel. All their sessions have been revoked.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* ───── FORM VIEW ───── */
          <div className="mt-5 space-y-4">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMode("generate")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === "generate"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Lucide icon="Sparkles" className="mr-1.5 inline h-3.5 w-3.5" />
                Auto-generate
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === "custom"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Lucide icon="Pencil" className="mr-1.5 inline h-3.5 w-3.5" />
                Set manually
              </button>
            </div>

            {mode === "generate" && (
              <p className="text-sm text-slate-600">
                A strong random password will be generated by the server and
                shown to you once. Copy it and share it with the user securely.
              </p>
            )}

            {mode === "custom" && (
              <>
                {/* Password */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Lucide
                        icon={showPassword ? "EyeOff" : "Eye"}
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                    autoComplete="new-password"
                  />
                  {confirm && password && confirm !== password && (
                    <p className="mt-1 text-xs text-rose-600">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <Lucide icon="Info" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This will reset the user&apos;s password and log them out of
                all devices. They will be forced to log in again with the new
                password.
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline-secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Resetting…
                  </>
                ) : (
                  <>
                    <Lucide icon="KeyRound" className="h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}