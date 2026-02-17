"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import FormCheck from "@/components/Base/Form/FormCheck";
import { api } from "@/lib/axios";
import { toast } from "sonner";

export default function SituationOfLine({
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

  // -------- Fetch Checklist and Prefill if existing --------
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        setLoading(true);

        // 🟢 Step 1: Fetch the base checklist template
        const res = await api.get("/api/v1/admin/checklists?type=LINE_TYPE");
        const checklistData = res.data?.data ?? [];

        // 🟢 Step 2: Fetch existing answers from PTW preview
        // const preview = await api.get(`/api/v1/ptw/${id}/preview`);
        const existingAnswers = [];

        // 🟢 Step 3: Convert existing answers → { [itemId]: value }
        // const prefilled: Record<number, string> = {};
        // existingAnswers.forEach(
        //   (a: { id: number; value: string | null }) => {
        //     if (a.value) prefilled[a.id] = a.value;
        //   }
        // );

        setChecklist(checklistData);
        setAnswers([]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load checklist or preview data");
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

  // -------- Submit --------
  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedAnswers = Object.entries(answers).map(([id, val]) => ({
      checklist_item_id: Number(id),
      value: val,
    }));

    if (formattedAnswers.length === 0) {
      toast.error("Please answer at least one item before submitting.");
      return;
    }

    const payload = { answers: formattedAnswers };
    console.log("🚀 Payload Sent:", payload);

    try {
      await api.post(`/api/v1/ptw/${id}/step2-line`, payload);
      toast.success("Checklist saved successfully!");
      next();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save checklist");
      next();
    }
  };

  const onReset = () => setAnswers({});

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
            <p className="text-base font-urdua opacity-70 " dir="rtl">
              {group.title_ur}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Form */}
      <form onSubmit={onSave} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {group.items.map((it) => (
              <div
                key={it.id}
                className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">
                  {it.label_en}
                </div>
                <div
                  className="text-sm text-slate-600 opacity-80 mb-2 font-urdu"
                  dir="rtl"
                >
                  {it.label_ur}
                </div>

                {/* YES / NO radio buttons */}
                <div className="flex gap-4">
                  {["YES", "NO"].map((val) => (
                    <label
                      key={val}
                      className={`flex items-center gap-2 cursor-pointer ${
                        answers[it.id] === val
                          ? "text-primary font-medium"
                          : "text-slate-700"
                      }`}
                    >
                      <FormCheck.Input
                        type="radio"
                        name={`item-${it.id}`}
                        value={val}
                        checked={answers[it.id] === val}
                        onChange={() => handleAnswer(it.id, val)}
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
