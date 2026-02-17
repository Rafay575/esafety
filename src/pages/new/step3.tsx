"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import { FormTextarea } from "@/components/Base/Form";
import FormCheck from "@/components/Base/Form/FormCheck";
import { api } from "@/lib/axios";
import { toast } from "sonner";

// Types for the new response
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

// For "other hazard" – we'll treat it specially if needed
// The response includes id: 25 "Danger of tools/equipment falling..." – no "other" item anymore.
// We'll keep the "other" field as a textarea if needed, but the new data doesn't include it.
// If you still need a free‑text hazard, you may add it manually.

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
  // State for each hazard: { value: "YES"/"NO", precautions: number[] }
  const [answers, setAnswers] = useState<
    Record<number, { value: string; precautions: number[] }>
  >({});
  const [otherText, setOtherText] = useState("");

  // -------- Fetch Hazards + existing answers --------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch hazards with precautions
        const res = await api.get("/api/v1/admin/checklists/hazards-with-precautions");
        const hazardsData: Hazard[] = res.data?.data ?? [];
        setHazards(hazardsData);

        // 2. Fetch existing PTW data to prefill (if any)
        // const preview = await api.get(`/api/v1/ptw/${id}/preview`);
        // const existingAnswers = preview.data?.data?.checklists?.HAZARDS ?? [];
        // const existingPrecautions = preview.data?.data?.hazard_precautions ?? [];

        // Build prefilled answers
        // const prefilled: Record<number, { value: string; precautions: number[] }> = {};
        // existingAnswers.forEach((a: { id: number; value: string | null }) => {
        //   if (a.value) {
        //     prefilled[a.id] = {
        //       value: a.value,
        //       precautions: existingPrecautions[a.id] || [], // assuming backend returns mapping
        //     };
        //   }
        // });
        // setAnswers(prefilled);

        // If no existing data, default all to NO with empty precautions
        const defaultAnswers: Record<number, { value: string; precautions: number[] }> = {};
        hazardsData.forEach((h) => {
          defaultAnswers[h.id] = { value: "NO", precautions: [] };
        });
        setAnswers(defaultAnswers);
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

      // If switching to YES, pre‑check all precautions
      const precautions = newValue === "YES" ? hazard.precautions.map((p) => p.id) : [];

      return {
        ...prev,
        [hazardId]: {
          value: newValue,
          precautions,
        },
      };
    });
  };

  // -------- Handle precaution checkbox toggle --------
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

    // Build payload
    const formattedAnswers = Object.entries(answers).map(([hazardIdStr, ans]) => {
      const hazardId = Number(hazardIdStr);
      return {
        hazard_id: hazardId,
        value: ans.value,
        precaution_ids: ans.value === "YES" ? ans.precautions : [], // only send precautions if YES
      };
    });

    // Optionally include the "other" text if we still have it
    // We'll add it as a special entry if needed
    if (otherText.trim()) {
      // Assuming there's a special hazard for "Other"
      const otherHazard = hazards.find((h) => h.label_en.toLowerCase().includes("other"));
      if (otherHazard) {
        formattedAnswers.push({
          hazard_id: otherHazard.id,
          value: "YES",
          precaution_ids: [], // no precautions for "other", but we have the text
          // need to extend type
        });
      }
    }

    console.log("🚀 Submitting Payload:", formattedAnswers);

    try {
      // You may need a different endpoint – step3-hazards might not accept this new structure.
      // If the backend expects the old format, you'll have to adapt.
      // I'll assume a new endpoint /step3-hazards-v2 or we keep the same but adjust backend.
      await api.post(`/api/v1/ptw/${id}/step3-hazards`, { hazards: formattedAnswers });
      toast.success("Hazard checklist saved successfully!");
      next();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save hazard checklist");
    }
  };

  const onReset = () => {
    // Reset to default: all NO, no precautions
    const defaultAnswers: Record<number, { value: string; precautions: number[] }> = {};
    hazards.forEach((h) => {
      defaultAnswers[h.id] = { value: "NO", precautions: [] };
    });
    setAnswers(defaultAnswers);
    setOtherText("");
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
                  {/* Hazard title (bilingual) */}
                  <div className="text-sm font-semibold text-slate-800">
                    {hazard.label_en}
                  </div>
                  <div
                    className="text-sm text-slate-600 font-urdu opacity-80 mb-3"
                    dir="rtl"
                  >
                    {hazard.label_ur}
                  </div>

                  {/* YES / NO Radios */}
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

                  {/* Precautions (only if YES) */}
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

                  {/* If no precautions but YES selected, show a message */}
                  {showPrecautions && hazard.precautions.length === 0 && (
                    <div className="ml-4 mt-2 text-xs text-slate-400 italic">
                      No specific precautions listed.
                    </div>
                  )}
                </div>
              );
            })}

            {/* Optional "Other hazard" free text field (if needed) */}
            {/* You can add a separate section for "Other" if your data doesn't include it */}
          </div>

          {/* Buttons */}
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