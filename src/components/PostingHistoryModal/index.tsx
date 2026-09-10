"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Base/Button";

export type Posting = {
  id: number;
  user_id?: number;
  region_id?: number;
  circle_id?: number;
  division_id?: number;
  sub_division_id?: number;
  feeder_id?: number;
  grid_id?: number | null;
  effective_from: string;
  effective_to: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  region?: { id?: number; code?: string; name: string } | null;
  circle?: { id?: number; region_id?: number; code?: string; name: string } | null;
  division?: { id?: number; circle_id?: number; code?: string; name: string } | null;
  sub_division?: {
    id?: number;
    division_id?: number;
    circle_id?: number;
    code?: string;
    name: string;
  } | null;
  feeder?: {
    id?: number;
    sub_division_id?: number;
    grid_station_id?: string;
    code?: string;
    name: string;
    voltage_level?: string | null;
  } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  postings: Posting[];
  currentPostingId?: number;
};

export default function PostingHistoryModal({
  open,
  onClose,
  postings,
  currentPostingId,
}: Props) {
  const [mounted, setMounted] = useState(false);

  // mount portal
  useEffect(() => setMounted(true), []);

  // prevent background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // close on escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Most recent posting first
  const sorted = [...postings].sort(
    (a, b) =>
      new Date(b.effective_from).getTime() -
      new Date(a.effective_from).getTime(),
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Posting history"
        >
          {/* Header */}
          <div className="shrink-0 border-b px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-800">
                Posting History
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {postings.length} posting{postings.length !== 1 ? "s" : ""} on
                record
              </div>
            </div>
           
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6 space-y-3">
            {sorted.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                No posting history found.
              </div>
            ) : (
              sorted.map((post) => {
                const isCurrent = post.id === currentPostingId;
                return (
                  <div
                    key={post.id}
                    className={`rounded-xl border p-4 ${
                      isCurrent
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500">
                        {post.effective_from} → {post.effective_to}
                      </span>
                      {isCurrent && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                      <Field
                        label="Region"
                        value={post.region?.name}
                        code={post.region?.code}
                      />
                      <Field
                        label="Circle"
                        value={post.circle?.name}
                        code={post.circle?.code}
                      />
                      <Field
                        label="Division"
                        value={post.division?.name}
                        code={post.division?.code}
                      />
                      <Field
                        label="Sub Division"
                        value={post.sub_division?.name}
                        code={post.sub_division?.code}
                      />
                      <Field
                        label="Feeder"
                        value={post.feeder?.name}
                        code={post.feeder?.code}
                      />
                      <Field
                        label="Grid Station"
                        value={post.feeder?.grid_station_id}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Tip: You can hit <span className="font-semibold">Esc</span> to
              close.
            </div>
            <Button type="button" variant="outline-secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  value,
  code,
}: {
  label: string;
  value?: string;
  code?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-slate-800 font-medium">
        {value || "—"}
        {code ? (
          <span className="text-slate-400 font-normal"> ({code})</span>
        ) : null}
      </div>
    </div>
  );
}