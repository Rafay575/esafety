"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import Button from "@/components/Base/Button";

// ---------- TYPES ----------
type ChecklistItem = {
  id: number;
  label_en: string;
  label_ur: string;
  value: "YES" | "NO" | null;
};

type LogItem = {
  id: number;
  action: string;
  role: string;
  notes: string;
  meta_json: string;
  created_at: string;
  actor_name: string;
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
    place_of_work: string | null;
    scheduled_start_at: string | null;
    estimated_duration_min: number | null;
    feeder_incharge_name: string | null;
    sub_division_name: string | null;
    location: string | null;
    close_feeder: string | null;
    alternate_feeder: string | null;
    switch_off_time: string | null;
    restore_time: string | null;
    safety_arrangements: string | null;
    feeder_name: string | null;
    transformer_name: string | null;
    evidences: { id: number; file_path: string; type: string }[];
    team_members: { id: number; name: string; avatar_url: string }[];
    logs?: LogItem[];
  };
  checklists: {
    LINE_TYPE: ChecklistItem[];
    HAZARDS: ChecklistItem[];
    PRECAUTION: ChecklistItem[];
  };
};

// ---------- HELPERS ----------
const badgeColor = (status: string): string => {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800",
    SDO_FORWARDED_TO_XEN: "bg-blue-100 text-blue-800",
    XEN_APPROVED_TO_PDC: "bg-teal-100 text-teal-800",
    PDC_DELEGATED_TO_GRID: "bg-purple-100 text-purple-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
};

const roleColor = (role: string): string => {
  const map: Record<string, string> = {
    SDO: "bg-amber-500",
    XEN: "bg-blue-500",
    PDC: "bg-teal-500",
    GRID: "bg-purple-500",
  };
  return map[role] || "bg-gray-400";
};

const chip = (val: "YES" | "NO" | null): JSX.Element => {
  const base =
    "px-2 w-20 flex justify-center items-center rounded-full text-xs font-medium border transition-colors";
  if (val === "YES")
    return <span className={`${base} border-green-200 bg-green-50 text-green-700`}>YES</span>;
  if (val === "NO")
    return <span className={`${base} border-red-200 bg-red-50 text-red-700`}>NO</span>;
  return <span className={`${base} border-slate-200 bg-slate-50 text-slate-600`}>Pending</span>;
};

// ---------- COMPONENT ----------
export default function PTWPreviewPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PTWPreviewData | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const userRoles: string[] = authUser?.roles ?? [];

  // ---------- Fetch Data ----------
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await api.get<{ data: PTWPreviewData }>(`/api/v1/ptw/${id}/preview`);
        setData(res.data.data);
      } catch {
        toast.error("Failed to load PTW preview");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ---------- Submit Handler ----------
  const handleSubmit = async (url: string, successMsg: string) => {
    if (!notes.trim()) return toast.warning("Please add notes first.");
    setSubmitting(true);
    try {
      await api.patch(url, { notes });
      toast.success(successMsg);
      navigate(-1);
    } catch {
      toast.error("Request failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading preview...
      </div>
    );

  if (!data)
    return <div className="p-6 text-center text-slate-500">No preview data found.</div>;

  const { ptw, checklists } = data;
  const logs = ptw.logs || [];

  const storageUrl = (p: string): string =>
    p.startsWith("http") ? p : `${api.defaults.baseURL?.split("/api")[0]}/storage/${p}`;

  // ---------- Role Logic ----------
  const canForwardSDO = userRoles.includes("SDO") && ptw.current_status === "DRAFT";
  const canApproveXEN =
    userRoles.includes("XEN") && ptw.current_status === "SDO_FORWARDED_TO_XEN";
  const canDelegatePDC =
    userRoles.includes("PDC") && ptw.current_status === "XEN_APPROVED_TO_PDC";
  const canPrecheckGRID =
    userRoles.includes("GridOperator") && ptw.current_status === "PDC_DELEGATED_TO_GRID";

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* ---------- HEADER ---------- */}
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Permit to Work (PTW) Preview</h1>
              <p className="text-xs text-slate-500" dir="rtl">ورک پرمٹ کا خلاصہ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${badgeColor(
                ptw.current_status
              )}`}
            >
              {ptw.current_status}
            </span>
            <Button variant="outline-secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- BODY ---------- */}
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* ---------- SUMMARY ---------- */}
        <motion.div
          className="border rounded-2xl bg-white p-6 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-base font-semibold mb-4 border-b pb-2">Summary / خلاصہ</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm leading-relaxed">
            <div>
              <p><b>PTW Code:</b> {ptw.ptw_code}</p>
              <p><b>Work Order:</b> {ptw.work_order_no}</p>
              <p><b>Type:</b> {ptw.type} ({ptw.misc_type})</p>
              <p><b>Subdivision:</b> {ptw.sub_division_name}</p>
              <p><b>Feeder:</b> {ptw.feeder_name}</p>
              <p><b>Transformer:</b> {ptw.transformer_name}</p>
            </div>
            <div>
              <p><b>Scheduled Start:</b> {ptw.scheduled_start_at}</p>
              <p><b>Duration:</b> {ptw.estimated_duration_min} mins</p>
              <p><b>Switch Off:</b> {ptw.switch_off_time}</p>
              <p><b>Restore:</b> {ptw.restore_time}</p>
              <p><b>Close / Alternate Feeder:</b> {ptw.close_feeder} / {ptw.alternate_feeder}</p>
              <p><b>Feeder Incharge:</b> {ptw.feeder_incharge_name}</p>
            </div>
          </div>
        </motion.div>

        {/* ---------- Work Details ---------- */}
        <motion.div
          className="border rounded-2xl bg-white p-6 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-base font-semibold mb-4 border-b pb-2">
            Work Details / کام کی تفصیل
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <p><b>Place of Work:</b> {ptw.place_of_work}</p>
            <p><b>Scope of Work:</b> {ptw.scope_of_work}</p>
            <p><b>Safety Arrangements:</b> {ptw.safety_arrangements}</p>
            <p><b>Location:</b> {ptw.location || "—"}</p>
          </div>
        </motion.div>

        {/* ---------- Team Members ---------- */}
        <motion.div
          className="border rounded-2xl bg-white p-6 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-base font-semibold mb-4 border-b pb-2">
            Team Members / ٹیم ممبرز
          </h2>
          {ptw.team_members?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ptw.team_members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 border rounded-xl p-3 hover:shadow-sm transition"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-500">ID: {m.id}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No team members added.</p>
          )}
        </motion.div>

        {/* ---------- Evidence ---------- */}
        <motion.div
          className="border rounded-2xl bg-white p-6 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-base font-semibold mb-4 border-b pb-2">Evidence Photos / شواہد</h2>
          {ptw.evidences?.length ? (
            <div className="flex flex-wrap gap-4">
              {ptw.evidences.map((e) => (
                <div key={e.id} className="w-32">
                  <img
                    src={storageUrl(e.file_path)}
                    alt={e.type}
                    className="w-32 h-28 object-cover border rounded-lg shadow-sm hover:scale-105 transition"
                  />
                  <p className="text-[11px] text-center mt-1 text-slate-600">
                    {e.type.replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No evidence available.</p>
          )}
        </motion.div>

        {/* ---------- Checklists ---------- */}
        {(Object.keys(checklists) as Array<keyof typeof checklists>).map((key) => (
          <motion.div
            key={key}
            className="border rounded-2xl bg-white p-6 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-base font-semibold mb-4 border-b pb-2">
              {key.replaceAll("_", " ")} Checklist
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {checklists[key]?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border rounded-lg p-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label_en}</p>
                    <p className="text-xs text-slate-500" dir="rtl">
                      {item.label_ur}
                    </p>
                  </div>
                  {chip(item.value)}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* ---------- Notes Section ---------- */}
        {(canForwardSDO || canApproveXEN || canDelegatePDC || canPrecheckGRID) && (
          <motion.div
            className="border rounded-2xl bg-white p-6 shadow-md space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-base font-semibold border-b pb-2">
              {canForwardSDO
                ? "Forward to XEN / نوٹس شامل کریں"
                : canApproveXEN
                ? "Approve & Forward to PDC / نوٹس شامل کریں"
                : canDelegatePDC
                ? "Delegate to GRID / نوٹس شامل کریں"
                : "Prechecks Done / نوٹس شامل کریں"}
            </h2>
            <textarea
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your notes..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              variant="primary"
              disabled={submitting}
              onClick={() =>
                canForwardSDO
                  ? handleSubmit(`/api/v1/ptw/${id}/forward-xen`, "Forwarded to XEN successfully")
                  : canApproveXEN
                  ? handleSubmit(`/api/v1/ptw/${id}/xen/approve-pdc`, "Forwarded to PDC successfully")
                  : canDelegatePDC
                  ? handleSubmit(`/api/v1/ptw/${id}/delegate-grid`, "Delegated to GRID successfully")
                  : handleSubmit(`/api/v1/ptw/${id}/prechecks-done`, "Prechecks marked as done")
              }
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting
                ? "Submitting..."
                : canForwardSDO
                ? "Forward to XEN"
                : canApproveXEN
                ? "Approve & Forward to PDC"
                : canDelegatePDC
                ? "Delegate to GRID"
                : "Mark Prechecks Done"}
            </Button>
          </motion.div>
        )}

        {/* ---------- Logs Section ---------- */}
        {logs.length > 0 && (
          <motion.div
            className="border rounded-2xl bg-white p-6 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-base font-semibold mb-4 border-b pb-2">
              Activity Logs / کارروائی کی تفصیل
            </h2>
            <ol className="relative border-l-2 border-blue-200 pl-6 space-y-5">
              {logs.map((log, i) => (
                <li key={log.id} className="relative">
                  <span
                    className={`absolute -left-[3.3%] top-0 flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] ${roleColor(
                      log.role
                    )}`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-slate-800">
                      {log.actor_name} ({log.role})
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {log.created_at}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-700 italic">“{log.notes || "—"}”</p>
                  <div className="text-xs text-slate-500 mt-1">
                    Action: <b>{log.action}</b>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </div>
    </div>
  );
}
