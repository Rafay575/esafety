import React, { useEffect, useMemo, useState } from "react";

/**
 * Canvas 8 – Cancellation Request (Line Superintendent)
 * Single bilingual software screen: English primary, Urdu alongside each field.
 * Updated: PTW number (search & select) REQUIRED, feeder(s) auto-shown from PTW,
 * quick-select reason presets + optional "Other" details. No name/mobile/signature.
 *
 * Fixes:
 * - Removed invalid escape sequences in JSX attributes (e.g., className=\"...\").
 * - Centralized validation into a pure function (getValidationError) and added console test cases.
 */

type Item = { key: string; en: string; ur: string };

type ReasonPreset =
  | "weather"
  | "urgentFault"
  | "resource"
  | "customer"
  | "safety"
  | "other"
  | "";

// Mock data – replace with API
const PTW_LIST = [
  { no: "WP-2025-001", feeders: ["Feeder A‑11"], subDiv: "Gulberg Sub‑Division" },
  { no: "WP-2025-014", feeders: ["Feeder B‑07", "Feeder C‑03"], subDiv: "Gulberg Sub‑Division" },
  { no: "WP-2025-021", feeders: ["Feeder D‑02"], subDiv: "Gulberg Sub‑Division" },
];

const L = {
  title: { en: "PTW – Part C (Cancellation Request)", ur: "پی ٹی ڈبلیو — حصہ ج (منسوخی کی درخواست)" },
  intro: { en: "Submit this when requesting to CANCEL the work permit.", ur: "جب ورک پرمٹ منسوخ کرانا ہو تو یہ فارم جمع کریں۔" },
  hint: { en: "Tick all that apply (✓)", ur: "متعلقہ خانوں پر ✓ لگائیں" },
  ptwNo: { en: "PTW Number (search & select)", ur: "پی ٹی ڈبلیو نمبر (تلاش کریں اور منتخب کریں)" },
  feeders: { en: "Feeder(s) under this PTW", ur: "اس پی ٹی ڈبلیو کے تحت فیڈر(ز)" },
  reasonPreset: { en: "Reason preset", ur: "منسوخی کا انتخابی سبب" },
  reasonOther: { en: "Reason details / Other", ur: "مزید تفصیل / دیگر وجہ" },
  date: { en: "Request Date", ur: "درخواست کی تاریخ" },
  time: { en: "Request Time", ur: "درخواست کا وقت" },
  attachments: { en: "Attachments (optional, multiple)", ur: "منسلکات (اختیاری، متعدد)" },
  submit: { en: "Submit Cancellation Request", ur: "منسوخی کی درخواست جمع کریں" },
  reset: { en: "Reset", ur: "ری سیٹ" },
};

const CHECKLIST: Item[] = [
  { key: "clearTools", en: "All tools and materials removed from the work area.", ur: "کام کی جگہ سے تمام اوزار اور سامان ہٹا دیا گیا ہے۔" },
  { key: "clearPeople", en: "All staff moved at least 3 meters (10 ft) away from work area.", ur: "تمام اہلکاروں کو کام کی جگہ سے کم از کم 3 میٹر (10 فٹ) دور کر دیا گیا ہے۔" },
  { key: "earthingRemoved", en: "All temporary earthing removed.", ur: "تمام عارضی ارتھنگ ہٹا دی گئی ہے۔" },
  { key: "noOtherWork", en: "No work is ongoing on the concerned feeders.", ur: "متعلقہ فیڈرز پر کوئی اور کام جاری نہیں۔" },
  { key: "controlInformed", en: "SDO/Control room informed before cancellation.", ur: "منسوخی سے پہلے ایس ڈی او/کنٹرول روم کو اطلاع دی گئی ہے۔" },
  { key: "firefightingReady", en: "Firefighting equipment ready.", ur: "آگ بجھانے والے آلات تیار ہیں۔" },
  { key: "roadsBarricaded", en: "Surroundings made safe (barricades/signage) before switching.", ur: "سوئچنگ سے قبل اطراف محفوظ (بیریکیڈ/نشانات) بنا دیے گئے ہیں۔" },
  { key: "siteMadeSafe", en: "If work not completed, site has been made safe for energization.", ur: "اگر کام مکمل نہیں ہوا تو سائٹ کو اینرجائزیشن کے لیے محفوظ بنا دیا گیا ہے۔" },
];

const REASONS = [
  { v: "weather", en: "Weather / rain / lightning", ur: "موسم / بارش / بجلی" },
  { v: "urgentFault", en: "Urgent fault elsewhere", ur: "کہیں اور فوری خرابی" },
  { v: "resource", en: "Resource/equipment not available", ur: "وسائل/اوزار دستیاب نہیں" },
  { v: "customer", en: "Customer/area request", ur: "کسٹمر/علاقے کی درخواست" },
  { v: "safety", en: "Safety risk identified", ur: "حفاظتی خطرہ سامنے آیا" },
  { v: "other", en: "Other…", ur: "دیگر…" },
];

// ----------------- Validation (pure) -----------------
export function getValidationError(ptwNo: string, reasonPreset: ReasonPreset, reasonOther: string): string | null {
  if (!ptwNo) return "Please select a PTW number.";
  if (!reasonPreset) return "Please choose a reason preset.";
  if (reasonPreset === "other" && !reasonOther.trim()) return "Please add reason details.";
  return null;
}

export default function CancellationRequest_Software() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [ptwInput, setPtwInput] = useState("");
  const [ptwNo, setPtwNo] = useState<string>("");
  const [reasonPreset, setReasonPreset] = useState<ReasonPreset>("");
  const [reasonOther, setReasonOther] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const ptw = useMemo(() => PTW_LIST.find((p) => p.no === ptwNo), [ptwNo]);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  const onReset = () => {
    setSelected({});
    setPtwNo("");
    setPtwInput("");
    setReasonPreset("");
    setReasonOther("");
    setFiles([]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = getValidationError(ptwNo, reasonPreset, reasonOther);
    if (err) {
      alert(err);
      return;
    }
    const payload = {
      ptwNo,
      subDivision: ptw?.subDiv,
      feeders: ptw?.feeders || [],
      checklist: Object.keys(selected).filter((k) => selected[k]),
      reason: { preset: reasonPreset, details: reasonOther },
      date,
      time,
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString(),
    };
    console.log("CANCEL_REQUEST_SW:", payload);
    alert("Cancellation request submitted. See console.");
  };

  function Label({ en, ur, required = false }: { en: string; ur: string; required?: boolean }) {
    return (
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium">
          {en} {required && <span className="text-red-600">*</span>}
        </span>
        <span className="text-xs opacity-70" dir="rtl">{ur}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{L.title.en} / {L.title.ur}</h1>
            <p className="text-xs opacity-70">{L.intro.en} — {L.intro.ur}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {/* PTW selection */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.ptwNo.en} ur={L.ptwNo.ur} required />
              <input
                list="ptwList"
                value={ptwInput}
                onChange={(e) => {
                  setPtwInput(e.target.value);
                  setPtwNo(e.target.value);
                }}
                placeholder="WP-2025-…"
                className="w-full rounded-md border px-3 py-2"
              />
              <datalist id="ptwList">{PTW_LIST.map((p) => (<option key={p.no} value={p.no} />))}</datalist>
            </div>
            <div>
              <Label en={L.feeders.en} ur={L.feeders.ur} />
              <div className="min-h-[42px] rounded-md border px-3 py-2 bg-gray-50 text-sm">
                {ptw ? ptw.feeders.join(", ") : "—"}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold">
              {L.hint.en} <span className="ml-2 text-xs opacity-70" dir="rtl">{L.hint.ur}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {CHECKLIST.map((it) => (
                <label key={it.key} className="flex items-start gap-3 rounded-lg border p-2 text-sm">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={!!selected[it.key]} onChange={() => toggle(it.key)} />
                  <div>
                    <div>{it.en}</div>
                    <div className="text-xs opacity-70" dir="rtl">{it.ur}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason presets */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.reasonPreset.en} ur={L.reasonPreset.ur} required />
              <select value={reasonPreset} onChange={(e) => setReasonPreset(e.target.value as ReasonPreset)} className="w-full rounded-md border px-3 py-2">
                <option value="">— Select —</option>
                {REASONS.map((r) => (<option key={r.v} value={r.v}>{r.en}</option>))}
              </select>
              <div className="mt-1 text-xs opacity-70" dir="rtl">{REASONS.find((r) => r.v === reasonPreset)?.ur || "—"}</div>
            </div>
            <div>
              <Label en={L.reasonOther.en} ur={L.reasonOther.ur} required={reasonPreset === "other"} />
              <textarea
                rows={3}
                value={reasonOther}
                onChange={(e) => setReasonOther(e.target.value)}
                placeholder={reasonPreset === "other" ? "Please provide details…" : "Optional"}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          {/* Date/Time */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.date.en} ur={L.date.ur} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <Label en={L.time.en} ur={L.time.ur} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          {/* Attachments */}
          <div className="mt-3">
            <Label en={L.attachments.en} ur={L.attachments.ur} />
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full rounded-md border px-3 py-2" />
            {files.length > 0 && (
              <ul className="mt-2 list-disc px-5 text-xs opacity-80">
                {files.map((f, i) => (<li key={i}>{f.name} — {(f.size / 1024).toFixed(1)} KB</li>))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">{L.reset.en} / {L.reset.ur}</button>
            <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-white shadow hover:bg-red-700">{L.submit.en} / {L.submit.ur}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ----------------- TEST CASES (console) -----------------
// These tests run once in the browser to validate the pure function behavior.
if (typeof window !== "undefined" && !(window as any).__PTW_CANCEL_TESTED__) {
  (window as any).__PTW_CANCEL_TESTED__ = true;
  // 1) Missing PTW number
  console.assert(
    getValidationError("", "weather", "x") === "Please select a PTW number.",
    "Test 1 failed: Missing PTW should error"
  );
  // 2) Missing reason preset
  console.assert(
    getValidationError("WP-2025-001", "", "") === "Please choose a reason preset.",
    "Test 2 failed: Missing reason preset should error"
  );
  // 3) Other without details
  console.assert(
    getValidationError("WP-2025-001", "other", " ") === "Please add reason details.",
    "Test 3 failed: 'Other' requires details"
  );
  // 4) Valid preset (weather)
  console.assert(
    getValidationError("WP-2025-001", "weather", "") === null,
    "Test 4 failed: Weather preset with PTW should be valid"
  );
  // 5) Valid 'other' with details
  console.assert(
    getValidationError("WP-2025-001", "other", "Storm alert") === null,
    "Test 5 failed: Other with details should be valid"
  );
  console.log("CancellationRequest_Software validation tests completed.");
}