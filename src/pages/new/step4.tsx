"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import Button from "@/components/Base/Button";
import { useNavigate } from "react-router-dom";

type ChecklistItem = {
  id: number;
  label_en: string;
  label_ur: string;
  value: "YES" | "NO" | null;
};

type PTWPreviewData = {
  ptw: {
    id: number;
    ptw_code: string;
    work_order_no: string;
    type: string;
    misc_type: string | null;
    scope_of_work: string | null;
    current_status: string;
    feeder_status: string | null;
    returned_by_role: string | null;
    sub_division_name: string | null;
    ls_name: string | null;
    sdo_name: string | null;
    xen_name: string | null;
    pdc_name: string | null;
    grid_incharge_name: string | null;
    switch_off_time: string | null;
    restore_time: string | null;
    due_time: string | null;
    estimated_duration_min: number | null;
    planned_schedule: { date: string; start_time: string; end_time: string }[];
    primary_feeders: Record<
      string,
      {
        grid_id: number;
        grid_code: string;
        feeders: {
          primary: Array<{ id: number; name: string; code: string; is_on: boolean }>;
        };
      }
    >;
    feeder_incharge_name: string | null;
    planned_from_date: string | null;
    planned_to_date: string | null;
    place_of_work: string | null;
    safety_arrangements: string | null;
    transformer_name: string | null;
    evidences: { id: number; file_path: string; type: string }[];
    team_members: { id: number; name: string; avatar_url: string }[];
    logs: {
      id: number;
      action: string;
      role: string;
      notes: string | null;
      created_at: string;
      actor_name: string;
    }[];
    workflow_continuations: string[];
  };
  checklists: {
    LINE_TYPE: ChecklistItem[];
    HAZARDS: ChecklistItem[];
    PRECAUTION: ChecklistItem[];
    GRID_PTW_ISSUE: ChecklistItem[];
    PTW_CANCELATION_OF_COMPLETION_BY_LS: ChecklistItem[];
    PTW_CANCEL_BY_GRID: ChecklistItem[];
  };
};

const badgeColor = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    GRID_RESTORED_AND_CLOSED: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  };
  return map[status] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
};

const chip = (val: "YES" | "NO" | null) => {
  const base =
    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200";
  if (val === "YES")
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}>
        YES
      </span>
    );
  if (val === "NO")
    return (
      <span className={`${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`}>
        NO
      </span>
    );
  return (
    <span className={`${base} bg-slate-100 text-slate-500 ring-1 ring-slate-200`}>
      Pending
    </span>
  );
};

const SectionCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`border border-slate-200/70 rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ en, ur }: { en: string; ur: string }) => (
  <h2 className="text-sm font-semibold text-slate-800 mb-4 flex flex-wrap items-baseline gap-2">
    <span>{en}</span>
    <span className="text-slate-300">/</span>
    <span className="font-urdu text-slate-500 text-sm">{ur}</span>
  </h2>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
      {label}
    </span>
    <span className="text-sm text-slate-700">{value ?? "—"}</span>
  </div>
);

export default function PTWPreview({ id, back }: { id: number; back: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PTWPreviewData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNotes, setSubmitNotes] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await api.get(`/api/v1/ptw/${id}/preview`);
        setData(res.data.data);
      } catch {
        toast.error("Failed to load PTW preview");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [id]);

  const openSubmitModal = () => {
    setSubmitNotes("");
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    if (submitting) return;
    setShowSubmitModal(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/ptw/${id}/submit`, {
        notes: submitNotes.trim(),
      });
      toast.success("PTW submitted successfully");
      setShowSubmitModal(false);
      navigate("/pjra-ptw");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit PTW");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
        <span className="text-sm">Loading preview...</span>
      </div>
    );

  if (!data)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-slate-400">No preview data found.</p>
      </div>
    );

  const { ptw, checklists } = data;

  const storageUrl = (p: string) =>
    p.startsWith("http")
      ? p
      : `${api.defaults.baseURL?.split("/api")[0]}/storage/${p}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-800 flex items-baseline gap-2">
            <span>PTW Preview</span>
            <span className="text-slate-300">/</span>
            <span className="font-urdu text-slate-500 text-base">پریویو</span>
          </h1>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${badgeColor(
              ptw.current_status
            )}`}
          >
            {ptw.current_status.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <SectionCard>
          <SectionTitle en="Summary" ur="خلاصہ" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="PTW Code" value={ptw.ptw_code} />
            <Field label="Due Time" value={ptw.due_time ? new Date(ptw.due_time).toLocaleString() : "—"} />
            <Field label="Work Order" value={ptw.work_order_no} />
            <Field label="Duration" value={ptw.estimated_duration_min ? `${ptw.estimated_duration_min} mins` : "—"} />
            <Field label="Type" value={`${ptw.type}${ptw.misc_type ? ` (${ptw.misc_type})` : ""}`} />
            <Field label="Feeder Incharge" value={ptw.feeder_incharge_name} />
            <Field label="Subdivision" value={ptw.sub_division_name} />
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle en="Work Details" ur="کام کی تفصیل" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Place of Work" value={ptw.place_of_work} />
            <Field label="Scope of Work" value={ptw.scope_of_work} />
            <Field label="Safety Arrangements" value={ptw.safety_arrangements} />
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle en="Team Members" ur="ٹیم ممبرز" />
          {ptw.team_members.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ptw.team_members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition-colors duration-200"
                >
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-700">{m.name}</div>
                    <div className="text-xs text-slate-400">ID: {m.id}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No team members added.</p>
          )}
        </SectionCard>

        <SectionCard>
          <SectionTitle en="Evidence Photos" ur="شواہد" />
          {ptw.evidences.length ? (
            <div className="flex flex-wrap gap-4">
              {ptw.evidences.map((e) => (
                <div key={e.id} className="w-32 group">
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <img
                      src={storageUrl(e.file_path)}
                      alt={e.type}
                      className="w-32 h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] text-center mt-1.5 text-slate-500">
                    {e.type.replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No evidences available.</p>
          )}
        </SectionCard>

        {(["LINE_TYPE", "HAZARDS"] as const).map((key) => (
          <SectionCard key={key}>
            <h2 className="text-sm font-semibold text-slate-800 mb-4 capitalize">
              {key.replaceAll("_", " ")} Checklist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checklists[key]?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between border border-slate-200 rounded-xl p-3.5 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label_en}</p>
                    <p className="text-xs font-urdu text-slate-400 mt-0.5" dir="rtl">
                      {item.label_ur}
                    </p>
                  </div>
                  {chip(item.value)}
                </div>
              ))}
            </div>
          </SectionCard>
        ))}

        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Button type="button" variant="outline-secondary" onClick={back}>
            <span className="inline-flex items-center gap-1.5">
              Back <span className="font-urdu">واپس جائیں</span>
            </span>
          </Button>
          <Button type="button" variant="primary" onClick={openSubmitModal}>
            <span className="inline-flex items-center gap-1.5">
              Submit <span className="font-urdu">جمع کروائیں</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={closeSubmitModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200/70 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-800 flex items-baseline gap-2">
              <span>Submit PTW</span>
              <span className="text-slate-300">/</span>
              <span className="font-urdu text-slate-500 text-sm">جمع کروائیں</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1.5">
              Add any notes for this submission, or leave it blank.
            </p>

            <div className="mt-4">
              <label className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
                Notes (optional)
              </label>
              <textarea
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                disabled={submitting}
                rows={4}
                placeholder="e.g. Testing for Resubmit"
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-shadow duration-200 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={closeSubmitModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span>Confirm Submit</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}