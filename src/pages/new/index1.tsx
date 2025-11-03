"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import { FormTextarea } from "@/components/Base/Form";
import FormCheck from "@/components/Base/Form/FormCheck";
import { api } from "@/lib/axios";
import { toast } from "sonner";

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
  const [checklist, setChecklist] = useState<
    {
      id: number;
      title_en: string;
      title_ur: string;
      items: {
        id: number;
        label_en: string;
        label_ur: string;
      }[];
    }[]
  >([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [otherText, setOtherText] = useState("");

  // -------- Fetch Checklist + Prefill if Exists --------
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        setLoading(true);

        // Step 1: Fetch hazard checklist template
        const res = await api.get("/api/v1/admin/checklists?type=HAZARDS");
        const checklistData = res.data?.data ?? [];

        // Step 2: Fetch existing PTW data to prefill
        const preview = await api.get(`/api/v1/ptw/${id}/preview`);
        const existingAnswers = preview.data?.data?.checklists?.HAZARDS ?? [];

        // Step 3: Map existing answers into state
        const prefilled: Record<number, string> = {};
        existingAnswers.forEach(
          (a: { id: number; value: string | null }) => {
            if (a.value) prefilled[a.id] = a.value;
          }
        );

        setChecklist(checklistData);
        setAnswers(prefilled);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hazards or preview data");
      } finally {
        setLoading(false);
      }
    };

    fetchChecklist();
  }, [id]);

  // -------- Handle Answer Change --------
  const handleAnswer = (itemId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  // -------- Submit Checklist --------
  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedAnswers = Object.entries(answers).map(([id, val]) => ({
      checklist_item_id: Number(id),
      value: val,
    }));

    if (formattedAnswers.length === 0) {
      toast.error("Please answer all required hazards before submitting.");
      return;
    }

    const payload = { answers: formattedAnswers };
    console.log("🚀 Submitting Payload:", payload);

    try {
      await api.post(`/api/v1/ptw/${id}/step3-hazards`, payload);
      toast.success("Hazard checklist saved successfully!");
      next();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save hazard checklist");
    }
  };

  const onReset = () => {
    setAnswers({});
    setOtherText("");
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading checklist...
      </div>
    );

  const group = checklist[0];
  if (!group)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        No checklist data found
      </div>
    );

  // -------- UI --------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{group.title_en}</h1>
            <p className="text-xs opacity-70" dir="rtl">
              {group.title_ur}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Form */}
      <form onSubmit={onSave} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {group.items.map((it) => {
              const isOther = it.label_en.toLowerCase().includes("other");
              const currentValue = answers[it.id] || "";

              return (
                <div
                  key={it.id}
                  className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    {it.label_en}
                  </div>
                  <div
                    className="text-xs text-slate-600 opacity-80 mb-2"
                    dir="rtl"
                  >
                    {it.label_ur}
                  </div>

                  {/* YES / NO Radios */}
                  <div className="flex gap-4">
                    {["YES", "NO"].map((val) => (
                      <label
                        key={val}
                        className={`flex items-center gap-2 cursor-pointer ${
                          currentValue === val
                            ? "text-primary font-medium"
                            : "text-slate-700"
                        }`}
                      >
                        <FormCheck.Input
                          type="radio"
                          name={`item-${it.id}`}
                          value={val}
                          checked={currentValue === val}
                          onChange={() => handleAnswer(it.id, val)}
                        />
                        {val}
                      </label>
                    ))}
                  </div>

                  {/* If "Other hazard" selected → extra field */}
                  {isOther && currentValue === "YES" && (
                    <FormTextarea
                      rows={2}
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Specify other hazard..."
                      className="mt-2 w-full border border-primary/40 bg-primary/5 text-sm"
                    />
                  )}
                </div>
              );
            })}
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
