import React, { useEffect, useMemo, useState } from "react";

/**
 * Canvas 9 – Grid In‑Charge (Software Screen)
 * Single bilingual form: English primary; Urdu translation alongside each label.
 * Task: In presence of LS, cancel PTW(s) and record re‑energization.
 *
 * Includes:
 * - Checklist confirmations (mandatory set enforced)
 * - PTW multi‑select (chips) with mock data (replace with API)
 * - Feeder name, remarks
 * - Grid In‑Charge name (auto), date + cancellation time (pre‑stamped), re‑energization time (required)
 * - Attachments (multiple)
 * - Pure validation with console test cases
 */

type Lang = "en" | "ur"; // not used for toggling UI here, but kept for future extensibility

// ------------ Mock data (replace with backend) ------------
const MOCK_GRID_USER = "Grid In‑Charge (Preview)";
const MOCK_PTW_LIST = ["WP-2025-001", "WP-2025-014", "WP-2025-021"]; // would come from backend

// ------------ Labels ------------
const L = {
  title: { en: "PTW – Part D (Grid In‑Charge)", ur: "پی ٹی ڈبلیو — حصہ د (گرڈ اِنچارج)" },
  intro: { en: "In presence of the LS/permit receiver, cancel PTW(s) and re‑energize as per procedure.", ur: "ایل ایس/پرمٹ وصول کنندہ کی موجودگی میں پرمٹ منسوخ کریں اور طریقہ کار کے مطابق اینرجائز کریں۔" },
  checklistHdr: { en: "Confirm before cancellation & re‑energization", ur: "منسوخی اور اینرجائزیشن سے پہلے تصدیق کریں" },
  presentLS: { en: "LS/permit receiver is present at substation.", ur: "ایل ایس/پرمٹ وصول کنندہ گرڈ پر موجود ہے۔" },
  spokeLinemen: { en: "Spoken with linemen on site; clearance confirmed.", ur: "سائٹ پر لائن مین سے بات کر کے کلیئرنس کی تصدیق۔" },
  sdoNotified: { en: "SDO/Control room informed about cancellation.", ur: "منسوخی کی اطلاع ایس ڈی او/کنٹرول روم کو دے دی گئی۔" },
  locksTagsRemoved: { en: "Locks/tags and temporary earthing removed by field team.", ur: "فیلڈ ٹیم نے لاک/ٹیگز اور عارضی ارتھنگ ہٹا دی۔" },
  panelSafe: { en: "Breakers/reclosers/panels checked safe.", ur: "بریکر/ریکلوزر/پینلز محفوظ چیک کیے گئے۔" },
  logBook: { en: "Entries made in log book (time, feeder, PTW no.).", ur: "لاگ بُک میں اندراج (وقت، فیڈر، پی ٹی ڈبلیو نمبر)۔" },

  ptwCancel: { en: "Cancel these PTW numbers (search & select)", ur: "ان پی ٹی ڈبلیو نمبرز کو منسوخ کریں (تلاش اور انتخاب)" },
  placeholderPTW: { en: "Type to search PTW…", ur: "پی ٹی ڈبلیو تلاش کریں…" },

  feederName: { en: "Feeder being re‑energized", ur: "جس فیڈر کو اینرجائز کیا جا رہا ہے" },
  remarks: { en: "Remarks", ur: "نوٹس/رمارکس" },

  giName: { en: "Grid In‑Charge Name (auto)", ur: "گرڈ اِنچارج کا نام (خودکار)" },
  date: { en: "Date (pre‑stamped)", ur: "تاریخ (پری اسٹیمپڈ)" },
  timeCancel: { en: "Cancellation Time (pre‑stamped)", ur: "منسوخی کا وقت (پری اسٹیمپڈ)" },
  timeEnergize: { en: "Re‑Energization Time (required)", ur: "اینرجائزیشن کا وقت (لازمی)" },

  attachments: { en: "Attachments (optional, multiple)", ur: "منسلکات (اختیاری، متعدد)" },

  reset: { en: "Reset", ur: "ری سیٹ" },
  save: { en: "Confirm, Cancel PTW & Re‑Energize", ur: "تصدیق کریں، پی ٹی ڈبلیو منسوخ اور اینرجائز کریں" },
};

// ------------ Validation (pure) ------------
export function validateGridForm(input: {
  checks: Record<string, boolean>;
  ptws: string[];
  timeEnergize: string;
}): string | null {
  const req = ["presentLS", "spokeLinemen", "sdoNotified", "locksTagsRemoved"] as const;
  const missing = req.filter((k) => !input.checks[k]);
  if (missing.length) return "Please complete mandatory confirmations.";
  if (!input.ptws || input.ptws.length === 0) return "Please select at least one PTW to cancel.";
  if (!input.timeEnergize) return "Please enter the re‑energization time.";
  return null;
}

export default function Canvas9_GridIncharge_Software() {
  // checklist
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecks((s) => ({ ...s, [k]: !s[k] }));

  // PTW chips + input
  const [ptwInput, setPtwInput] = useState("");
  const [ptwSelected, setPtwSelected] = useState<string[]>([]);
  const addPTW = () => {
    const v = ptwInput.trim();
    if (!v) return;
    if (!MOCK_PTW_LIST.includes(v)) return; // restrict to known list (mock)
    if (ptwSelected.includes(v)) return;
    setPtwSelected((s) => [...s, v]);
    setPtwInput("");
  };
  const removePTW = (v: string) => setPtwSelected((s) => s.filter((x) => x !== v));

  // misc fields
  const [feeder, setFeeder] = useState("");
  const [remarks, setRemarks] = useState("");
  const [giName] = useState(MOCK_GRID_USER);
  const [date, setDate] = useState("");
  const [timeCancel, setTimeCancel] = useState("");
  const [timeEnergize, setTimeEnergize] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTimeCancel(now.toTimeString().slice(0, 5));
  }, []);

  const onReset = () => {
    setChecks({});
    setPtwSelected([]);
    setPtwInput("");
    setFeeder("");
    setRemarks("");
    setFiles([]);
    setTimeEnergize("");
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateGridForm({ checks, ptws: ptwSelected, timeEnergize });
    if (err) { alert(err); return; }
    const payload = {
      checks: Object.keys(checks).filter((k) => checks[k]),
      ptwCancelled: ptwSelected,
      feeder,
      remarks,
      giName,
      date,
      timeCancel,
      timeEnergize,
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString(),
    };
    console.log("GRID_CANCEL_ACK_SW:", payload);
    alert("Cancellation & re‑energization recorded. See console.");
  };

  function Label({ en, ur, required = false }: { en: string; ur: string; required?: boolean }) {
    return (
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium">{en} {required && <span className="text-red-600">*</span>}</span>
        <span className="text-xs opacity-70" dir="rtl">{ur}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{L.title.en} / {L.title.ur}</h1>
            <p className="text-xs opacity-70">{L.intro.en} — {L.intro.ur}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={onSave} className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {/* Checklist */}
          <div>
            <div className="mb-2 text-sm font-semibold">{L.checklistHdr.en} <span className="ml-2 text-xs opacity-70" dir="rtl">{L.checklistHdr.ur}</span></div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {["presentLS","spokeLinemen","sdoNotified","locksTagsRemoved","panelSafe","logBook"].map((key) => {
                const labelMap: Record<string, {en:string; ur:string}> = {
                  presentLS: { en: L.presentLS.en, ur: L.presentLS.ur },
                  spokeLinemen: { en: L.spokeLinemen.en, ur: L.spokeLinemen.ur },
                  sdoNotified: { en: L.sdoNotified.en, ur: L.sdoNotified.ur },
                  locksTagsRemoved: { en: L.locksTagsRemoved.en, ur: L.locksTagsRemoved.ur },
                  panelSafe: { en: L.panelSafe.en, ur: L.panelSafe.ur },
                  logBook: { en: L.logBook.en, ur: L.logBook.ur },
                };
                return (
                  <label key={key} className="flex items-start gap-3 rounded-lg border p-2 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={!!checks[key]} onChange={() => toggle(key)} />
                    <div>
                      <div>{labelMap[key].en}</div>
                      <div className="text-xs opacity-70" dir="rtl">{labelMap[key].ur}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* PTW chips + feeder */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.ptwCancel.en} ur={L.ptwCancel.ur} required />
              <div className="rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <input
                    list="ptwList"
                    value={ptwInput}
                    onChange={(e) => setPtwInput(e.target.value)}
                    placeholder={`${L.placeholderPTW.en} / ${L.placeholderPTW.ur}`}
                    className="flex-1 rounded-md border px-3 py-2"
                  />
                  <button type="button" onClick={addPTW} className="rounded-md bg-blue-600 px-3 py-2 text-white">Add / شامل کریں</button>
                </div>
                <datalist id="ptwList">
                  {MOCK_PTW_LIST.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
                {ptwSelected.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ptwSelected.map((v) => (
                      <span key={v} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs">
                        {v}
                        <button type="button" onClick={() => removePTW(v)} className="text-blue-700">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label en={L.feederName.en} ur={L.feederName.ur} />
              <input value={feeder} onChange={(e) => setFeeder(e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          <div className="mt-3">
            <Label en={L.remarks.en} ur={L.remarks.ur} />
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>

          {/* Footer fields */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.giName.en} ur={L.giName.ur} />
              <input value={giName} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label en={L.date.en} ur={L.date.ur} />
                <input type="date" value={date} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50" />
              </div>
              <div>
                <Label en={L.timeCancel.en} ur={L.timeCancel.ur} />
                <input type="time" value={timeCancel} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50" />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.timeEnergize.en} ur={L.timeEnergize.ur} required />
              <input type="time" value={timeEnergize} onChange={(e) => setTimeEnergize(e.target.value)} className="w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <Label en={L.attachments.en} ur={L.attachments.ur} />
              <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">{L.reset.en} / {L.reset.ur}</button>
            <button type="submit" className="rounded-xl bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700">{L.save.en} / {L.save.ur}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ----------------- TEST CASES (console) -----------------
if (typeof window !== "undefined" && !(window as any).__GRID_ISSUE_TESTED__) {
  (window as any).__GRID_ISSUE_TESTED__ = true;
  // 1) Missing mandatory checks
  console.assert(
    validateGridForm({ checks: {}, ptws: ["WP-2025-001"], timeEnergize: "10:00" }) === "Please complete mandatory confirmations.",
    "Test 1 failed: should require mandatory checks"
  );
  // 2) Missing PTWs
  console.assert(
    validateGridForm({ checks: { presentLS: true, spokeLinemen: true, sdoNotified: true, locksTagsRemoved: true }, ptws: [], timeEnergize: "10:00" }) === "Please select at least one PTW to cancel.",
    "Test 2 failed: should require at least one PTW"
  );
  // 3) Missing energization time
  console.assert(
    validateGridForm({ checks: { presentLS: true, spokeLinemen: true, sdoNotified: true, locksTagsRemoved: true }, ptws: ["WP-2025-001"], timeEnergize: "" }) === "Please enter the re‑energization time.",
    "Test 3 failed: should require energization time"
  );
  // 4) Valid
  console.assert(
    validateGridForm({ checks: { presentLS: true, spokeLinemen: true, sdoNotified: true, locksTagsRemoved: true }, ptws: ["WP-2025-001"], timeEnergize: "11:30" }) === null,
    "Test 4 failed: valid case should pass"
  );
  console.log("Canvas 9 validation tests completed.");
}
