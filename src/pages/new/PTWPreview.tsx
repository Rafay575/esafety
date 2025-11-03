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
    place_of_work: string | null;
    scheduled_start_at: string | null;
    estimated_duration_min: number | null;
    feeder_incharge_name: string | null;
    ls_id: string | null;
    sdo_id: string | null;
    sub_division_name: string | null;
    location: string | null;
    close_feeder: string | null;
    alternate_feeder: string | null;
    switch_off_time: string | null;
    restore_time: string | null;
    safety_arrangements: string | null;
    feeder_name: string | null;
    transformer_name: string | null;
    evidences: {
      id: number;
      file_path: string;
      type: string;
    }[];
    team_members: {
      id: number;
      name: string;
      avatar_url: string;
    }[];
  };
  checklists: {
    LINE_TYPE: ChecklistItem[];
    HAZARDS: ChecklistItem[];
    PRECAUTION: ChecklistItem[];
  };
};

const badgeColor = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
};

const chip = (val: "YES" | "NO" | null) => {
  const base =
    "px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200";
  if (val === "YES")
    return <span className={`${base} bg-green-100 text-green-700`}>YES</span>;
  if (val === "NO")
    return <span className={`${base} bg-red-100 text-red-700`}>NO</span>;
  return <span className={`${base} bg-slate-100 text-slate-600`}>Pending</span>;
};

export default function PTWPreview({id,back}:{id:number,back:()=>void}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PTWPreviewData | null>(null);
 
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
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading preview...
      </div>
    );

  if (!data)
    return (
      <div className="p-6 text-center text-slate-500">
        No preview data found.
      </div>
    );

  const { ptw, checklists } = data;

  const storageUrl = (p: string) =>
    p.startsWith("http")
      ? p
      : `${api.defaults.baseURL?.split("/api")[0]}/storage/${p}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 border-b bg-white/80 backdrop-blur-sm z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-800">
            PTW Preview / پریویو
          </h1>
          <span className={`text-xs px-2 py-1 rounded-full ${badgeColor(ptw.current_status)}`}>
            {ptw.current_status}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* Summary */}
        <div className="border rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Summary / خلاصہ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
        </div>

        {/* Work Details */}
        <div className="border rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">
            Work Details / کام کی تفصیل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><b>Place of Work:</b> {ptw.place_of_work}</p>
            <p><b>Scope of Work:</b> {ptw.scope_of_work}</p>
            <p><b>Safety Arrangements:</b> {ptw.safety_arrangements}</p>
            <p><b>Location:</b> {ptw.location || "—"}</p>
          </div>
        </div>

        {/* Team Members */}
        <div className="border rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">
            Team Members / ٹیم ممبرز
          </h2>
          {ptw.team_members?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ptw.team_members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 border rounded-lg p-2"
                >
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-10 h-10 rounded-full border object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-slate-500">ID: {m.id}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No team members added.</p>
          )}
        </div>

        {/* Evidences */}
        <div className="border rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">
            Evidence Photos / شواہد
          </h2>
          {ptw.evidences?.length ? (
            <div className="flex flex-wrap gap-4">
              {ptw.evidences.map((e) => (
                <div key={e.id} className="w-32">
                  <img
                    src={storageUrl(e.file_path)}
                    alt={e.type}
                    className="w-32 h-28 object-cover border rounded-lg"
                  />
                  <p className="text-[11px] text-center mt-1 text-slate-600">
                    {e.type.replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No evidences available.</p>
          )}
        </div>

        {/* Checklists */}
        {(["LINE_TYPE", "HAZARDS", "PRECAUTION"] as const).map((key) => (
          <div
            key={key}
            className="border rounded-2xl bg-white p-6 shadow-sm space-y-3"
          >
            <h2 className="text-sm font-semibold capitalize">
              {key.replaceAll("_", " ")} Checklist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checklists[key]?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between border rounded-md p-3"
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
          </div>
        ))}

        {/* Print Button */}
        <div className="flex justify-end gap-3 pt-4">
           <Button type="button" variant="outline-secondary" onClick={back}>
              Back / واپس جائیں
            </Button>
            <Button type="submit" variant="primary"  onClick={()=>navigate('/pjra-ptw')}>
            Submit / جمع کروائیں
            </Button>
          </div>
      </div>
    </div>
  );
}
