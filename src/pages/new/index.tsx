"use client";

import React, { useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormTextarea } from "@/components/Base/Form";
import FormCheck from "@/components/Base/Form/FormCheck"; // <-- use your FormCheck

type Item = {
  key: string;
  en: string;
  ur: string;
};

type Group = {
  title: { en: string; ur: string };
  items: Item[];
};

const GROUPS: Group[] = [
  {
    title: { en: "Voltage / Class", ur: "وولٹیج / درجہ" },
    items: [
      {
        key: "lt400",
        en: "LT line (up to 400 V)",
        ur: "لو وولٹیج لائن (400 وولٹ تک)",
      },
      {
        key: "ht1133",
        en: "HT line (11 / 33 kV)",
        ur: "ایچ ٹی لائن (11 / 33 کلو وولٹ)",
      },
    ],
  },
  {
    title: { en: "Status", ur: "حالت" },
    items: [
      { key: "dead", en: "Line dead / isolated", ur: "لائن ڈیڈ / آئسولیٹڈ" },
      {
        key: "live",
        en: "Line energized / live",
        ur: "لائن اینرجائزڈ / چل رہی ہے",
      },
      {
        key: "fed",
        en: "Feeder is back-feed / being fed",
        ur: "فیڈر بیک فیڈ یا فیڈ ہے",
      },
    ],
  },
  {
    title: { en: "Construction Type", ur: "تعمیر کی قسم" },
    items: [
      { key: "oh", en: "Overhead line", ur: "اوور ہیڈ لائن" },
      { key: "ug", en: "Underground cable", ur: "زیر زمین کیبل" },
      {
        key: "dt",
        en: "Distribution / Transmission line",
        ur: "ڈسٹری بیوشن / ٹرانسمیشن لائن",
      },
    ],
  },
  {
    title: { en: "Other Conditions", ur: "دیگر حالات" },
    items: [
      {
        key: "streetLight",
        en: "Street lights are ON",
        ur: "سٹریٹ لائٹس آن ہیں",
      },
    ],
  },
];

export default function SituationOfLineBilingual() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      selected: Object.keys(selected).filter((k) => selected[k]),
      notes,
    };
    console.log("SITUATION_OF_LINE:", payload);
    alert("Saved. Check console for payload.");
  };

  const onReset = () => {
    setSelected({});
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className=" border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">
              Checklist – Situation of Line where PTW is required
            </h1>
            <p className="text-xs opacity-70" dir="rtl">
              پی ٹی ڈبلیو درکار ہونے کی صورت میں لائن کی صورتحال — چیک لسٹ
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSave} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-6 ">
          {GROUPS.map((g) => (
            <div key={g.title.en} className="mb-5">
              <div className="mb-2 border-b pb-1 text-sm font-semibold">
                {g.title.en}
                <span className="ml-2 text-xs opacity-70" dir="rtl">
                  {g.title.ur}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {g.items.map((it) => {
                  const checked = !!selected[it.key];
                  return (
                    <div
                      key={it.key}
                      onClick={() => toggle(it.key)} // ✅ clicking anywhere toggles checkbox
                      className={`cursor-pointer rounded-lg border p-3 transition hover:bg-slate-50 ${
                        checked
                          ? "border-primary/60 bg-primary/5"
                          : "border-slate-200"
                      }`}
                    >
                      <FormCheck className="items-start">
                        <FormCheck.Input
                          type="checkbox"
                          checked={checked}
                          readOnly // ✅ prevent double-trigger when wrapper handles click
                          className="mt-0.5 pointer-events-none"
                          aria-checked={checked}
                          aria-label={it.en}
                        />
                        <FormCheck.Label className="ml-3 select-none">
                          <div className="text-sm font-medium text-slate-800">
                            {it.en}
                          </div>
                          <div
                            className="text-xs text-slate-600 opacity-80"
                            dir="rtl"
                          >
                            {it.ur}
                          </div>
                        </FormCheck.Label>
                      </FormCheck>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="mt-4">
            <div className="mb-1 text-sm font-semibold">
              Notes{" "}
              <span className="ml-2 text-xs opacity-70" dir="rtl">
                نوٹس
              </span>
            </div>
            <FormTextarea
              rows={3}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Write any additional notes here..."
              className="w-full"
            />
          </div>

          {/* Buttons */}
     
        </div>
      </form>
    </div>
  );
}
