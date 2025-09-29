import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate, useParams } from "react-router-dom";
import { regionsApi } from "./api";
import type { Region } from "../types";

export default function RegionViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) throw new Error();
        const res = await regionsApi.get(id);
        setRow(res);
      } catch {
        alert("Region not found");
        navigate("/organization/regions");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, navigate]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">Region Details</h2>
        <div className="ml-auto flex items-center gap-2">
          {row && (
            <Button variant="outline-secondary" onClick={() => navigate(`/organization/regions/${row.id}/edit`)}>
              <Lucide icon="PencilLine" className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <Lucide icon="ChevronLeft" className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="col-span-12 intro-y">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          {loading || !row ? (
            <div className="py-12 text-center text-slate-500">Loading…</div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-8">
                <div className="text-xl font-semibold">{row.name}</div>
                <div className="text-slate-500 mt-1">
                  Code: <span className="font-medium">{row.code || "-"}</span>
                </div>
                <div className="mt-4">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset " +
                      (row.status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                        : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-darkmode-400 dark:text-slate-200 dark:ring-darkmode-300")
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + (row.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                    {row.status}
                  </span>
                </div>

                {row.notes && (
                  <div className="mt-6">
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <div className="text-slate-700 whitespace-pre-wrap">{row.notes}</div>
                  </div>
                )}
              </div>

              <div className="col-span-12 md:col-span-4">
                <div className="rounded-xl border p-4">
                  <div className="text-sm font-medium mb-2">Meta</div>
                  <div className="text-xs text-slate-500">Created</div>
                  <div className="text-sm mb-3">{new Date(row.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Updated</div>
                  <div className="text-sm">{new Date(row.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
