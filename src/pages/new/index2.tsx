import React, { useMemo, useState } from "react";

/**
 * Canvas 4 – Safety Precautions (Single bilingual form, EN with Urdu alongside each field)
 * Desktop/tablet software screen (no phone frame). 3‑step wizard to cover all 44 items.
 * Critical items gate the final save for compliance.
 */

type Item = { key: string; en: string; ur: string; critical?: boolean };

const S1: Item[] = [
  { key: "ptwDisplayed", en: "PTW displayed at site", ur: "پرمٹ سائٹ پر نمایاں آویزاں" },
  { key: "lotopermit", en: "LOTO applied at all points", ur: "تمام پوائنٹس پر LOTO نافذ", critical: true },
  { key: "tagPoints", en: "Isolation points tagged", ur: "آئسولیشن پوائنٹس ٹیگ شدہ" },
  { key: "isolationVerified", en: "Isolation verified by test", ur: "آئسولیشن کی تصدیق کی گئی" },
  { key: "testAbsence", en: "Test for absence of voltage (TAV)", ur: "ولٹیج کی عدم موجودگی کی جانچ", critical: true },
  { key: "earthSourceSide", en: "Portable earths applied – source side", ur: "پورٹیبل ارتھ — سورس سائیڈ", critical: true },
  { key: "earthLoadSide", en: "Portable earths applied – load side", ur: "پورٹیبل ارتھ — لوڈ سائیڈ", critical: true },
  { key: "bondNeutrals", en: "Neutral/earth bonding confirmed", ur: "نیوٹریل/ارتھ بانڈنگ کی تصدیق" },
  { key: "dischargeCap", en: "Discharge capacitors / induction", ur: "کیپیسیٹر/انڈکشن کا ڈسچارج" },
  { key: "removeBackfeed", en: "Back‑feed eliminated (DG/solar/UPS)", ur: "بیک فیڈ ختم (DG/سولر/UPS)" },
  { key: "safeDistance", en: "Maintain safe working clearance", ur: "محفوظ فاصلہ برقرار" },
  { key: "permitValidity", en: "Permit time/limits checked", ur: "پرمٹ وقت/حدود کی جانچ" },
  { key: "weatherCheck", en: "Weather checked (rain/storm)", ur: "موسم کی جانچ (بارش/آندھی)" },
  { key: "standbyRescue", en: "Standby/rescue person assigned", ur: "اسٹینڈ بائی/ریسکیو فرد مقرر" },
  { key: "jsaToolbox", en: "JSA & toolbox talk completed", ur: "جے ایس اے اور ٹول باکس ٹاک مکمل" },
];

const S2: Item[] = [
  { key: "ppeHelmet", en: "Helmet / FR clothing / gloves", ur: "ہیلمٹ / ایف آر کپڑے / دستانے", critical: true },
  { key: "ppeArc", en: "Arc‑rated face shield / goggles", ur: "آرک ریٹیڈ فیس شیلڈ / چشمہ" },
  { key: "ppeShoe", en: "Safety shoes / dielectric boots", ur: "سیفٹی شوز / ڈائی الیکٹرک بوٹس" },
  { key: "ppeHearing", en: "Hearing protection (ear plugs)", ur: "کانوں کی حفاظت (ایر پلگز)" },
  { key: "ppeFall", en: "Full body harness / fall arrest", ur: "فل باڈی ہارنس / فال اَریسٹ" },
  { key: "lifeline", en: "Lifeline/anchorage set & inspected", ur: "لائف لائن/اینکرج سیٹ و معائنہ" },
  { key: "insulatedTools", en: "Insulated tools / hot sticks", ur: "انسولیٹڈ ٹولز / ہاٹ اسٹکس" },
  { key: "rubberMat", en: "Rubber mat / platform in place", ur: "ربڑ میٹ / پلیٹ فارم موجود" },
  { key: "ladderScaffold", en: "Approved ladder / scaffold", ur: "منظور شدہ سیڑھی / اسکیفولڈ" },
  { key: "manlift", en: "Bucket truck / manlift inspected", ur: "بکٹ ٹرک / مین لفٹ چیک شدہ" },
  { key: "gasDetector", en: "Gas detector tested (confined spaces)", ur: "گیس ڈیٹیکٹر ٹیسٹ (بند جگہ)" },
  { key: "ventilation", en: "Ventilation blower arranged", ur: "وینٹیلیشن بلاور کا انتظام" },
  { key: "fireExt", en: "Fire extinguisher available", ur: "فائر ایکسٹنگشر دستیاب", critical: true },
  { key: "firstAid", en: "First‑aid kit & CPR knowledge", ur: "فرسٹ ایڈ کٹ اور سی پی آر" },
  { key: "rescueKit", en: "Rescue kit (belt, rope, hook)", ur: "ریسکیو کٹ (بیلٹ، رَسّی، ہُک)" },
];

const S3: Item[] = [
  { key: "barricade", en: "Barricading, cones & danger plates", ur: "بیریکیڈنگ، کونز اور ڈینجر پلیٹس", critical: true },
  { key: "reflectiveAtNight", en: "Reflective tape/lighting for night", ur: "رات کیلئے ریفلیکٹو ٹیپ/لائٹنگ" },
  { key: "accessCtrl", en: "Access control / watchman present", ur: "رسائی کنٹرول / چوکیدار" },
  { key: "publicDiversion", en: "Public diversion/flagman arranged", ur: "عوام کی ڈائیورژن/فلیگ مین" },
  { key: "roadPermit", en: "Road/traffic permit obtained", ur: "سڑک/ٹریفک پرمٹ حاصل" },
  { key: "noSmoking", en: "No smoking / ignition sources controlled", ur: "سگریٹ نوشی/اگنیشن پر پابندی" },
  { key: "comms", en: "Walkie‑talkie/phone communication set", ur: "واکی ٹاکی/فون رابطہ سیٹ" },
  { key: "supervisorNotify", en: "Supervisor/Control room notified", ur: "سپر وائزر/کنٹرول روم کو اطلاع" },
  { key: "permitCopyGrid", en: "Permit copy shared with Grid In‑charge", ur: "پرمٹ کی کاپی گرڈ اِنچارج کو" },
  { key: "toolsSecured", en: "Tools/material secured at height", ur: "اونچائی پر سازوسامان محفوظ" },
  { key: "housekeeping", en: "Housekeeping – no slip/trip", ur: "ہاؤس کیپنگ — پھسلن/ٹھوکر نہیں" },
  { key: "wasteDisposal", en: "Waste/chemical disposal planned", ur: "فضلہ/کیمیکلز کا انتظام" },
  { key: "liveAdjacent", en: "Adjacent live parts shielded/covered", ur: "قریب زندہ حصوں پر شیلڈ/کورنہ" },
  { key: "reenergizeCheck", en: "Re‑energization sequence clarified", ur: "ری اینرجائزیشن ترتیب واضح" },
];

const STEPS = [
  { id: 1, titleEn: "Isolation, Earthing & Authorization", titleUr: "آئسولیشن، ارتھنگ اور اجازت", items: S1 },
  { id: 2, titleEn: "PPE, Tools & Special Equipment", titleUr: "پی پی ای، اوزار اور خصوصی آلات", items: S2 },
  { id: 3, titleEn: "Site Controls, Access & Communication", titleUr: "سائٹ کنٹرول، رسائی اور رابطہ", items: S3 },
] as const;

export default function SafetyPrecautionsWizardBilingual() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);

  const current = useMemo(() => STEPS.find((s) => s.id === step)!, [step]);
  const percent = useMemo(() => {
    const total = STEPS.reduce((n, s) => n + s.items.length, 0);
    const checked = Object.values(state).filter(Boolean).length;
    return Math.round((checked / total) * 100);
  }, [state]);

  const toggle = (k: string) => setState((s) => ({ ...s, [k]: !s[k] }));
  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const addCustom = () => { const v = custom.trim(); if (!v) return; setCustomList((c) => [...c, v]); setCustom(""); };
  const reset = () => { setState({}); setCustom(""); setCustomList([]); setStep(1); };

  const CRITICAL_KEYS = [
    "lotopermit","testAbsence","earthSourceSide","earthLoadSide","ppeHelmet","fireExt","barricade"
  ];
  const criticalOk = CRITICAL_KEYS.every((k) => !!state[k]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criticalOk) {
      alert("Please complete all critical items (LOTO, TAV, earthing both sides, PPE, extinguisher, barricades).");
      return;
    }
    const payload = {
      selected: Object.entries(state).filter(([,v])=>v).map(([k])=>k),
      custom: customList,
      progress: percent,
      timestamp: new Date().toISOString(),
    };
    console.log("PRECAUTIONS_44:", payload);
    alert("Checklist saved. See console.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Safety Precautions – PTW Checklist</h1>
            <p className="text-xs opacity-70" dir="rtl">حفاظتی اقدامات — پی ٹی ڈبلیو چیک لسٹ</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-48 overflow-hidden rounded-full border">
              <div className="h-2 bg-blue-600" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs tabular-nums">{percent}%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={save} className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {/* Step header */}
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-sm font-semibold">
              {current.titleEn}
              <span className="ml-2 text-xs opacity-70" dir="rtl">{current.titleUr}</span>
            </div>
            <div className="text-xs opacity-70">Step {step} / 3</div>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {current.items.map((it) => (
              <label key={it.key} className={`flex items-start gap-3 rounded-lg border p-2 text-sm ${it.critical ? 'border-red-300' : ''}`}>
                <input type="checkbox" className="mt-1 h-4 w-4" checked={!!state[it.key]} onChange={() => toggle(it.key)} />
                <div>
                  <div className="flex items-center gap-2">
                    <span>{it.en}</span>
                    {it.critical && <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-600">Critical</span>}
                  </div>
                  <div className="text-xs opacity-70" dir="rtl">{it.ur}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Custom precaution (on step 3 for compactness) */}
          {step === 3 && (
            <div className="mt-3 rounded-xl border p-3">
              <div className="mb-2 text-sm font-medium">Custom Precaution <span className="ml-2 text-xs opacity-70" dir="rtl">اپنا حفاظتی اقدام شامل کریں</span></div>
              <div className="flex gap-2">
                <input value={custom} onChange={(e)=>setCustom(e.target.value)} placeholder="Type precaution / اقدام لکھیں" className="flex-1 rounded-md border px-3 py-2"/>
                <button type="button" onClick={addCustom} className="rounded-md bg-blue-600 px-3 py-2 text-white">Add / شامل کریں</button>
              </div>
              {customList.length > 0 && (
                <ul className="mt-2 list-disc px-5 text-sm">
                  {customList.map((c,i)=> (<li key={i}>{c}</li>))}
                </ul>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs">
              <span className={`font-medium ${criticalOk ? 'text-green-700' : 'text-red-700'}`}>
                {criticalOk ? 'Critical items complete' : 'Critical items pending'}
              </span>
              <span className="ml-2 opacity-70" dir="rtl">{criticalOk ? 'اہم نکات مکمل' : 'اہم نکات باقی'}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={back} disabled={step===1} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50">Back / پچھلا</button>
              {step < 3 ? (
                <button type="button" onClick={next} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">Next / اگلا</button>
              ) : (
                <button type="submit" disabled={!criticalOk} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">Save / محفوظ کریں</button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}