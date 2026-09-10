"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import FormCheck from "@/components/Base/Form/FormCheck";
import { api } from "@/lib/axios";
import { toast } from "sonner";

type Precaution = {
  id: number;
  label_en: string;
  label_ur: string;
};

type Hazard = {
  id: number;
  label_en: string;
  label_ur: string;
  precautions: Precaution[];
};

export default function HazardIdentificationChecklist({
  id,
  next,
  back,
}: {
  id: number;
  next: () => void;
  back: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [answers, setAnswers] = useState<
    Record<number, { value: string; precautions: number[] }>
  >({});

  // -------- Fetch Hazards + Prefill from Preview --------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch hazards with precautions and existing PTW preview
        const [hazardsRes, previewRes] = await Promise.all([
          api.get("/api/v1/admin/checklists/hazards-with-precautions"),
          api.get(`/api/v1/ptw/${id}/preview`),
        ]);

        const hazardsData: Hazard[] = hazardsRes.data?.data ?? [];
        setHazards(hazardsData);

        // Extract existing HAZARDS answers from preview
        const hazardItems = previewRes.data?.data?.checklists?.HAZARDS ?? [];
        const prefilled: Record<number, { value: string; precautions: number[] }> = {};

        hazardItems.forEach((item: any) => {
          const hazard = hazardsData.find((h) => h.id === item.id);
          if (!hazard) return;

          prefilled[item.id] = {
            value: item.value === "YES" ? "YES" : "NO",
            // Auto‑select all precautions if YES, matching existing UI behavior
            precautions: item.value === "YES" ? hazard.precautions.map((p) => p.id) : [],
          };
        });

        // Default any missing hazards to NO with empty precautions
        hazardsData.forEach((h) => {
          if (!prefilled[h.id]) {
            prefilled[h.id] = { value: "NO", precautions: [] };
          }
        });

        setAnswers(prefilled);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hazards");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // -------- Handle YES/NO change --------
  const handleValueChange = (hazardId: number, newValue: string) => {
    setAnswers((prev) => {
      const hazard = hazards.find((h) => h.id === hazardId);
      if (!hazard) return prev;

      const precautions =
        newValue === "YES" ? hazard.precautions.map((p) => p.id) : [];

      return {
        ...prev,
        [hazardId]: {
          value: newValue,
          precautions,
        },
      };
    });
  };

  // -------- Handle precaution checkbox toggle (though they are disabled) --------
  const togglePrecaution = (hazardId: number, precautionId: number) => {
    setAnswers((prev) => {
      const current = prev[hazardId];
      if (!current) return prev;

      const newPrecautions = current.precautions.includes(precautionId)
        ? current.precautions.filter((id) => id !== precautionId)
        : [...current.precautions, precautionId];

      return {
        ...prev,
        [hazardId]: {
          ...current,
          precautions: newPrecautions,
        },
      };
    });
  };

  // -------- Submit --------
  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedAnswers = Object.entries(answers).map(([hazardIdStr, ans]) => ({
      checklist_item_id: Number(hazardIdStr),
      value: ans.value,
    }));

    console.log("🚀 Submitting Payload:", formattedAnswers);

    try {
      await api.post(`/api/v1/ptw/${id}/step3-hazards`, {
        answers: formattedAnswers,
      });
      toast.success("Hazard checklist saved successfully!");
      next();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save hazard checklist");
    }
  };

  const onReset = () => {
    const defaultAnswers: Record<number, { value: string; precautions: number[] }> = {};
    hazards.forEach((h) => {
      defaultAnswers[h.id] = { value: "NO", precautions: [] };
    });
    setAnswers(defaultAnswers);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading hazards...
      </div>
    );

  if (hazards.length === 0)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        No hazard data found
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Hazard Identification Checklist</h1>
            <p className="text-xs opacity-70" dir="rtl">
              خطرات کی نشاندہی کی فہرست
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Form */}
      <form onSubmit={onSave} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
            {hazards.map((hazard) => {
              const answer = answers[hazard.id] || { value: "NO", precautions: [] };
              const showPrecautions = answer.value === "YES";

              return (
                <div
                  key={hazard.id}
                  className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    {hazard.label_en}
                  </div>
                  <div
                    className="text-sm text-slate-600 font-urdu opacity-80 mb-3"
                    dir="rtl"
                  >
                    {hazard.label_ur}
                  </div>

                  <div className="flex gap-6 mb-3">
                    {["YES", "NO"].map((val) => (
                      <label
                        key={val}
                        className={`flex items-center gap-2 cursor-pointer ${
                          answer.value === val
                            ? "text-primary font-medium"
                            : "text-slate-700"
                        }`}
                      >
                        <FormCheck.Input
                          type="radio"
                          name={`hazard-${hazard.id}`}
                          value={val}
                          checked={answer.value === val}
                          onChange={() => handleValueChange(hazard.id, val)}
                        />
                        {val}
                      </label>
                    ))}
                  </div>

                  {showPrecautions && hazard.precautions.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2 border-l-2 border-primary/30 pl-4 intro-x">
                      <p className="text-xs font-medium text-slate-600">
                        Precautions / احتیاطی تدابیر
                      </p>
                      {hazard.precautions.map((precaution) => (
                        <label
                          key={precaution.id}
                          className="flex items-start gap-2 cursor-pointer text-sm"
                        >
                          <FormCheck.Input
                            type="checkbox"
                            disabled
                            checked={answer.precautions.includes(precaution.id)}
                            onChange={() => togglePrecaution(hazard.id, precaution.id)}
                          />
                          <div>
                            <span className="text-slate-700">{precaution.label_en}</span>
                            <span className="block text-slate-500 font-urdu text-xs" dir="rtl">
                              {precaution.label_ur}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {showPrecautions && hazard.precautions.length === 0 && (
                    <div className="ml-4 mt-2 text-xs text-slate-400 italic">
                      No specific precautions listed.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline-secondary" onClick={back}>
              Back / واپس جائیں
            </Button>
            <Button type="button" variant="outline-secondary" onClick={onReset}>
              Reset / ری سیٹ
            </Button>
            <Button type="submit" variant="primary">
              Submit / جمع کروائیں
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}