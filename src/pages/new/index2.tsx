"use client";

import React, { useState, useMemo } from "react";
import Button from "@/components/Base/Button";
import { FormSelect, FormTextarea,FormInput } from "@/components/Base/Form";
import FormCheck from "@/components/Base/Form/FormCheck";
import FormLabel from "@/components/Base/Form/FormLabel";

type Item = { key: string; en: string; ur: string; critical?: boolean };
type Group = { titleEn: string; titleUr: string; items: Item[] };

// ---------- Data ----------
const GROUPS: Group[] = [
  {
    titleEn: "Isolation, Earthing & Authorization",
    titleUr: "آئسولیشن، ارتھنگ اور اجازت",
    items: [
      { key: "ptwDisplayed", en: "PTW displayed at site", ur: "پرمٹ سائٹ پر نمایاں آویزاں" },
      { key: "lotopermit", en: "LOTO applied at all points", ur: "تمام پوائنٹس پر LOTO نافذ", critical: true },
      { key: "tagPoints", en: "Isolation points tagged", ur: "آئسولیشن پوائنٹس ٹیگ شدہ" },
      { key: "isolationVerified", en: "Isolation verified by test", ur: "آئسولیشن کی تصدیق کی گئی" },
      { key: "testAbsence", en: "Test for absence of voltage (TAV)", ur: "ولٹیج کی عدم موجودگی کی جانچ", critical: true },
      { key: "earthSourceSide", en: "Portable earths applied – source side", ur: "پورٹیبل ارتھ — سورس سائیڈ", critical: true },
      { key: "earthLoadSide", en: "Portable earths applied – load side", ur: "پورٹیبل ارتھ — لوڈ سائیڈ", critical: true },
      { key: "bondNeutrals", en: "Neutral/earth bonding confirmed", ur: "نیوٹریل/ارتھ بانڈنگ کی تصدیق" },
      { key: "dischargeCap", en: "Discharge capacitors / induction", ur: "کیپیسیٹر/انڈکشن کا ڈسچارج" },
      { key: "removeBackfeed", en: "Back-feed eliminated (DG/solar/UPS)", ur: "بیک فیڈ ختم (DG/سولر/UPS)" },
    ],
  },
  {
    titleEn: "PPE, Tools & Special Equipment",
    titleUr: "پی پی ای، اوزار اور خصوصی آلات",
    items: [
      { key: "ppeHelmet", en: "Helmet / FR clothing / gloves", ur: "ہیلمٹ / ایف آر کپڑے / دستانے", critical: true },
      { key: "ppeArc", en: "Arc-rated face shield / goggles", ur: "آرک ریٹیڈ فیس شیلڈ / چشمہ" },
      { key: "ppeShoe", en: "Safety shoes / dielectric boots", ur: "سیفٹی شوز / ڈائی الیکٹرک بوٹس" },
      { key: "ppeFall", en: "Full body harness / fall arrest", ur: "فل باڈی ہارنس / فال اَریسٹ" },
      { key: "fireExt", en: "Fire extinguisher available", ur: "فائر ایکسٹنگشر دستیاب", critical: true },
    ],
  },
  {
    titleEn: "Site Controls, Access & Communication",
    titleUr: "سائٹ کنٹرول، رسائی اور رابطہ",
    items: [
      { key: "barricade", en: "Barricading, cones & danger plates", ur: "بیریکیڈنگ، کونز اور ڈینجر پلیٹس", critical: true },
      { key: "reflectiveAtNight", en: "Reflective tape/lighting for night", ur: "رات کیلئے ریفلیکٹو ٹیپ/لائٹنگ" },
      { key: "accessCtrl", en: "Access control / watchman present", ur: "رسائی کنٹرول / چوکیدار" },
      { key: "supervisorNotify", en: "Supervisor/Control room notified", ur: "سپر وائزر/کنٹرول روم کو اطلاع" },
    ],
  },
];

const CRITICAL_KEYS = [
  "lotopermit",
  "testAbsence",
  "earthSourceSide",
  "earthLoadSide",
  "ppeHelmet",
  "fireExt",
  "barricade",
];

// ---------- Component ----------
export default function SafetyPrecautionsBilingual() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [custom, setCustom] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);

  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key] }));
  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    setCustomList([...customList, v]);
    setCustom("");
  };
  const reset = () => {
    setSelected({});
    setNotes("");
    setCustom("");
    setCustomList([]);
  };

  const percent = useMemo(() => {
    const total = GROUPS.reduce((t, g) => t + g.items.length, 0);
    const checked = Object.values(selected).filter(Boolean).length;
    return Math.round((checked / total) * 100);
  }, [selected]);

  const criticalOk = CRITICAL_KEYS.every((k) => !!selected[k]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criticalOk) {
      alert("⚠️ Complete all critical items before saving.");
      return;
    }
    const payload = {
      selected: Object.keys(selected).filter((k) => selected[k]),
      customList,
      notes,
      progress: percent,
      timestamp: new Date().toISOString(),
    };
    console.log("✅ SAFETY_PRECAUTIONS:", payload);
    alert("Checklist saved. Check console for payload.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div>
            <h2 className="text-lg font-semibold">Safety Precautions – PTW Checklist</h2>
            <p className="text-xs opacity-70" dir="rtl">
              حفاظتی اقدامات — پی ٹی ڈبلیو چیک لسٹ
            </p>
          </div>
         
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl px-6 pt-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {GROUPS.map((g) => (
            <div key={g.titleEn} className="mb-6">
              <FormLabel className="mb-2 font-semibold">
                {g.titleEn}
                <span className="ml-2 text-xs opacity-70" dir="rtl">
                  {g.titleUr}
                </span>
              </FormLabel>
             <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
  {g.items.map((it) => {
    const applied = !!selected[it.key];
    return (
      <div
        key={it.key}
        onClick={() => toggle(it.key)}
        className={`cursor-pointer rounded-lg border p-2 transition ${
          it.critical
            ? "border-red-300 hover:border-red-400"
            : "border-slate-200 hover:border-slate-300"
        } ${applied ? "bg-primary/5 border-primary/50" : ""}`}
      >
        <FormCheck className="items-start">
          <FormCheck.Input
            type="checkbox"
            checked={applied}
            readOnly
            className="mt-0.5 pointer-events-none"
            aria-checked={applied}
            aria-label={it.en}
          />
          <FormCheck.Label className="ml-3 select-none">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              {it.en}
              {it.critical && (
                <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                  Critical
                </span>
              )}
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

          {/* Custom Precaution */}
          <div className="rounded-xl border p-4 mb-4">
            <FormLabel className="mb-2 font-medium">
              Custom Precaution{" "}
              <span className="ml-2 text-xs opacity-70" dir="rtl">
                اپنا حفاظتی اقدام شامل کریں
              </span>
            </FormLabel>
            <div className="flex gap-2">
              <FormInput
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                placeholder="Type precaution / اقدام لکھیں"
              />
              <Button type="button" variant="primary" onClick={addCustom}>
                Add / شامل کریں
              </Button>
            </div>
            {customList.length > 0 && (
              <ul className="mt-2 list-disc px-5 text-sm">
                {customList.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes */}
          <FormLabel className="font-medium mb-1">
            Notes / نوٹس
          </FormLabel>
          <FormTextarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes or observations"
          />

          {/* Footer */}
          <div className="mt-6 flex flex-col md:flex-row justify-between gap-3">
            <div className="text-xs">
              <span
                className={`font-medium ${
                  criticalOk ? "text-green-700" : "text-red-700"
                }`}
              >
                {criticalOk ? "Critical items complete" : "Critical items pending"}
              </span>
              <span className="ml-2 opacity-70" dir="rtl">
                {criticalOk ? "اہم نکات مکمل" : "اہم نکات باقی"}
              </span>
            </div>
         
          </div>
        </div>
      </form>
    </div>
  );
}
