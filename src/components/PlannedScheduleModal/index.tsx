"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Base/Button";
import { FormInput } from "@/components/Base/Form";
import FormLabel from "@/components/Base/Form/FormLabel";
import clsx from "clsx";
import { toast } from "sonner";

export type PlannedScheduleRow = {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
};

type Props = {
  open: boolean;
  onClose: () => void;

  initialFrom?: string;
  initialTo?: string;
  initialSchedule?: PlannedScheduleRow[];

  onSave: (payload: {
    planned_from_date: string;
    planned_to_date: string;
    planned_schedule: PlannedScheduleRow[];
  }) => void;
};

function toDate(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, (m || 1) - 1, dd || 1);
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function timeToMinutes(t: string) {
  if (!t) return NaN;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function PlannedScheduleModal({
  open,
  onClose,
  initialFrom = "",
  initialTo = "",
  initialSchedule = [],
  onSave,
}: Props) {
  const [mounted, setMounted] = useState(false);

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const [rows, setRows] = useState<PlannedScheduleRow[]>(initialSchedule);

  // mount portal
  useEffect(() => setMounted(true), []);

  // reset when opened
  useEffect(() => {
    if (!open) return;
    setFrom(initialFrom || "");
    setTo(initialTo || "");
    setRows(initialSchedule || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // prevent background scroll
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

  const canGenerate = useMemo(() => {
    if (!from || !to) return false;
    const a = toDate(from);
    const b = toDate(to);
    return b.getTime() >= a.getTime();
  }, [from, to]);

  const generateDays = () => {
    if (!from || !to) {
      toast.error("Please select start and end date.");
      return;
    }
    const a = toDate(from);
    const b = toDate(to);
    if (b.getTime() < a.getTime()) {
      toast.error("End date must be greater than or equal to start date.");
      return;
    }

    const days: PlannedScheduleRow[] = [];
    let cur = a;
    while (cur.getTime() <= b.getTime()) {
      const dateStr = formatDate(cur);

      // keep existing times if user already set them
      const existing = rows.find((r) => r.date === dateStr);
      days.push(
        existing || {
          date: dateStr,
          start_time: "10:00",
          end_time: "11:00",
        },
      );

      cur = addDays(cur, 1);
    }
    setRows(days);
  };

  const updateRow = (idx: number, patch: Partial<PlannedScheduleRow>) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const validate = () => {
    if (!from || !to) {
      toast.error("Please select start and end date.");
      return false;
    }
    const a = toDate(from);
    const b = toDate(to);
    if (b.getTime() < a.getTime()) {
      toast.error("End date must be greater than or equal to start date.");
      return false;
    }
    if (!rows.length) {
      toast.error("Please generate schedule days.");
      return false;
    }

    for (const r of rows) {
      const sm = timeToMinutes(r.start_time);
      const em = timeToMinutes(r.end_time);
      if (!r.start_time || !r.end_time || Number.isNaN(sm) || Number.isNaN(em)) {
        toast.error(`Please set valid times for ${r.date}`);
        return false;
      }
    
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      planned_from_date: from,
      planned_to_date: to,
      planned_schedule: rows,
    });

    toast.success("Planned schedule saved");
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full screen panel */}
      <div className="absolute inset-0 flex max-w-7xl mx-auto h-[75vh] my-auto">
        <div
          className={clsx(
            "relative w-full h-full bg-white",
            "flex flex-col",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Planned schedule"
        >
          {/* Header */}
          <div className="shrink-0 border-b bg-white">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-800">
                  Planned Schedule
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Select start/end date, then generate days and set timings.
                </div>
              </div>

            
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
              {/* Date Range */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <FormLabel>Start Date</FormLabel>
                    <FormInput
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      onBlur={() => {
                        // optional auto-generate on blur when both set
                        if (from && to) generateDays();
                      }}
                    />
                  </div>

                  <div>
                    <FormLabel>End Date</FormLabel>
                    <FormInput
                      type="date"
                      value={to}
                      min={from || undefined}
                      onChange={(e) => setTo(e.target.value)}
                      onBlur={() => {
                        if (from && to) generateDays();
                      }}
                    />
                    {!canGenerate && from && to ? (
                      <div className="text-xs text-red-600 mt-1">
                        End date must be greater than or equal to start date
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={!canGenerate}
                      onClick={generateDays}
                    >
                      Generate Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => {
                        setFrom("");
                        setTo("");
                        setRows([]);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Daily Timings
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Total days: {rows.length}
                    </div>
                  </div>

                  {!!rows.length ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => {
                          // quick apply first row to all
                          const first = rows[0];
                          if (!first) return;
                          setRows((prev) =>
                            prev.map((r) => ({
                              ...r,
                              start_time: first.start_time,
                              end_time: first.end_time,
                            })),
                          );
                        }}
                      >
                        Apply 1st day to all
                      </Button>
                    </div>
                  ) : null}
                </div>

                {!rows.length ? (
                  <div className="p-6 text-sm text-slate-500">
                    No schedule generated yet. Pick dates and click{" "}
                    <span className="font-semibold">Generate Days</span>.
                  </div>
                ) : (
                  <div className="p-5 overflow-x-auto">
                    <table className="min-w-[720px] w-full">
                      <thead>
                        <tr className="text-left text-xs text-slate-500">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Start Time</th>
                          <th className="py-2 pr-4">End Time</th>
                          <th className="py-2 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => {
                          const sm = timeToMinutes(r.start_time);
                          const em = timeToMinutes(r.end_time);
                          const invalid = !r.start_time || !r.end_time || em <= sm;

                          return (
                            <tr
                              key={r.date}
                              className="border-t border-slate-100"
                            >
                              <td className="py-3 pr-4 text-sm text-slate-800 font-medium">
                                {r.date}
                              </td>
                              <td className="py-3 pr-4">
                                <FormInput
                                  type="time"
                                  value={r.start_time}
                                  onChange={(e) =>
                                    updateRow(idx, {
                                      start_time: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="py-3 pr-4">
                                <FormInput
                                  type="time"
                                  value={r.end_time}
                                  onChange={(e) =>
                                    updateRow(idx, { end_time: e.target.value })
                                  }
                                />
                              </td>
                              <td className="py-3 pr-4">
                                {invalid ? (
                                  <span className="text-xs text-red-600">
                                    End time must be greater
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600">
                                    OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t bg-white">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Tip: You can hit <span className="font-semibold">Esc</span> to
                close.
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={handleSave}>
                  Save Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
