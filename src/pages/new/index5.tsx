import React, { useEffect, useMemo, useState } from "react";

/**
 * Canvas 6 – PTW Issuer Section (Single bilingual form)
 * English is primary; Urdu translation shown alongside each label.
 * Desktop/tablet software screen. Multi-select feeders (chips), pre-stamped date/time, logged-in issuer, attachments, and geo-tag.
 */

// ---- Mock data (replace with real API) ----
const MOCK_USER = "Issuance Officer (Preview)"; // should come from auth
const SUB_DIVISION = "Gulberg Sub‑Division"; // should come from Part A
const FEEDERS_BY_SUBDIV: Record<string, string[]> = {
  [SUB_DIVISION]: [
    "Feeder A‑11",
    "Feeder B‑07",
    "Feeder C‑03",
    "Feeder D‑02",
    "Feeder E‑15",
  ],
};

// ---- Labels (EN / UR) ----
const L = {
  title: { en: "PTW – Part B (Permit Issuer)", ur: "پی ٹی ڈبلیو — حصہ ب (پرمٹ جاری کرنے والا)" },
  intro: { en: "Issuer confirms prerequisites and issues the permit.", ur: "جاری کنندہ شرائط کی تصدیق کرکے پرمٹ جاری کرتا ہے۔" },
  feedersList: { en: "Feeders OFF (search & select one or more)", ur: "بند فیڈرز (تلاش کریں اور ایک یا زیادہ منتخب کریں)" },
  remarks: { en: "Remarks", ur: "نوٹ/رمارکس" },
  issuerName: { en: "Issuer / Officer Name (auto)", ur: "پرمٹ جاری کرنے والے افسر کا نام (خودکار)" },
  issueDate: { en: "Date of Issue (pre‑stamped)", ur: "پرمٹ جاری کرنے کی تاریخ (پری اسٹیمپڈ)" },
  issueTime: { en: "Time of Issue (pre‑stamped)", ur: "پرمٹ جاری کرنے کا وقت (پری اسٹیمپڈ)" },
  attachments: { en: "Attachments (multiple)", ur: "منسلکات (متعدد)" },
  geo: { en: "Geo‑Location (auto)", ur: "جیو لوکیشن (خودکار)" },
  checklistHdr: { en: "Confirm before issuing", ur: "جاری کرنے سے پہلے تصدیق کریں" },
  save: { en: "Issue Permit", ur: "پرمٹ جاری کریں" },
  reset: { en: "Reset", ur: "ری سیٹ" },
  placeholderFeeder: { en: "Type to search feeders…", ur: "فیڈرز تلاش کریں…" },
  add: { en: "Add", ur: "شامل کریں" },
};

const CHECKS = [
  { key: "receiverPresent", en: "Permit receiver is present at site.", ur: "ورک پرمٹ وصول کنندہ موقع پر موجود ہے۔" },
  { key: "sdoInformed", en: "SDO/Control room informed; shutdown granted.", ur: "ایس ڈی او/کنٹرول روم کو اطلاع دی گئی؛ شٹ ڈاؤن ملا۔" },
  { key: "feedersIdentified", en: "All concerned feeders identified/marked.", ur: "تمام متعلقہ فیڈرز کی نشاندہی کر دی گئی ہے۔" },
  { key: "locksApplied", en: "Locks applied on all relevant feeder switches.", ur: "تمام متعلقہ فیڈر سوئچز پر تالے لگا دیے گئے ہیں۔" },
  { key: "reclosersTagged", en: "Auto‑reclosers/sectionalizers locked & tagged.", ur: "آٹو ریکلوذر/سیکشن لائزر لاک اور ٹیگ کیے گئے۔" },
  { key: "gridSideGrounding", en: "Grid‑side grounding applied.", ur: "گرِڈ سائیڈ گراؤنڈنگ لگا دی گئی ہے۔" },
  { key: "dropoutsOpened", en: "Outside‑substation cut‑outs/drop‑outs opened & tagged.", ur: "سب اسٹیشن سے باہر کٹ آؤٹس/ڈراپ آؤٹس کھول کر ٹیگ کیے گئے۔" },
  { key: "dangerIsolated", en: "Dangerous points isolated; caution notices placed.", ur: "خطرناک مقامات آئسولیٹ اور وارننگ آویزاں۔" },
];

export default function PTW_Issuer_Software() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState("");
  const [issuerName] = useState(MOCK_USER); // read‑only
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [coords, setCoords] = useState<{lat?: number; lng?: number}>({});

  // feeders multi-select via chips + datalist
  const allowedFeeders = FEEDERS_BY_SUBDIV[SUB_DIVISION] || [];
  const [feederInput, setFeederInput] = useState("");
  const [selectedFeeders, setSelectedFeeders] = useState<string[]>([]);

  const addFeeder = () => {
    const v = feederInput.trim();
    if (!v) return;
    if (!allowedFeeders.includes(v)) return; // enforce current sub‑division
    if (selectedFeeders.includes(v)) return;
    setSelectedFeeders((s) => [...s, v]);
    setFeederInput("");
  };
  const removeFeeder = (name: string) => setSelectedFeeders((s) => s.filter((x) => x !== name));

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0,5));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({})
      );
    }
  }, []);

  const toggle = (k: string) => setChecks((s) => ({ ...s, [k]: !s[k] }));

  const onReset = () => {
    setChecks({});
    setRemarks("");
    setSelectedFeeders([]);
    setFeederInput("");
    setFiles([]);
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    // minimal guard: must pick at least one feeder and confirm presence + SDO informed
    const required = ["receiverPresent", "sdoInformed"];
    const missing = required.filter((k) => !checks[k]);
    if (selectedFeeders.length === 0 || missing.length > 0) {
      alert("Please select feeder(s) and confirm mandatory checks.");
      return;
    }
    const payload = {
      selectedChecks: Object.keys(checks).filter((k) => checks[k]),
      feedersOff: selectedFeeders,
      remarks,
      issuerName,
      issueDate: date,
      issueTime: time,
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      geo: coords,
      subDivision: SUB_DIVISION,
    };
    console.log("ISSUER_SECTION_PAYLOAD", payload);
    alert("Issuer section saved. See console.");
  };

  // ---- UI helpers ----
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

      <form onSubmit={onSave} className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {/* Checklist */}
          <div>
            <div className="mb-2 text-sm font-semibold">{L.checklistHdr.en} <span className="ml-2 text-xs opacity-70" dir="rtl">{L.checklistHdr.ur}</span></div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {CHECKS.map((c) => (
                <label key={c.key} className="flex items-start gap-3 rounded-lg border p-2 text-sm">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={!!checks[c.key]} onChange={() => toggle(c.key)} />
                  <div>
                    <div>{c.en}</div>
                    <div className="text-xs opacity-70" dir="rtl">{c.ur}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Feeders multi-select */}
          <div className="mt-4">
            <Label en={`${L.feedersList.en} (${SUB_DIVISION})`} ur={L.feedersList.ur} required />
            <div className="rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <input
                  list="feedersList"
                  value={feederInput}
                  onChange={(e) => setFeederInput(e.target.value)}
                  placeholder={`${L.placeholderFeeder.en} / ${L.placeholderFeeder.ur}`}
                  className="flex-1 rounded-md border px-3 py-2"
                />
                <button type="button" onClick={addFeeder} className="rounded-md bg-blue-600 px-3 py-2 text-white">{L.add.en} / {L.add.ur}</button>
              </div>
              <datalist id="feedersList">
                {allowedFeeders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              {selectedFeeders.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedFeeders.map((f) => (
                    <span key={f} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs">
                      {f}
                      <button type="button" onClick={() => removeFeeder(f)} className="text-blue-700">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-3">
            <Label en={L.remarks.en} ur={L.remarks.ur} />
            <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-md border px-3 py-2"/>
          </div>

          {/* Footer fields */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={`${L.issuerName.en}`} ur={`${L.issuerName.ur}`} />
              <input value={issuerName} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label en={L.issueDate.en} ur={L.issueDate.ur} />
                <input type="date" value={date} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
              </div>
              <div>
                <Label en={L.issueTime.en} ur={L.issueTime.ur} />
                <input type="time" value={time} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="mt-3">
            <Label en={L.attachments.en} ur={L.attachments.ur} />
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full rounded-md border px-3 py-2"/>
            {files.length > 0 && (
              <ul className="mt-2 list-disc px-5 text-xs opacity-80">
                {files.map((f, i) => (
                  <li key={i}>{f.name} — {(f.size/1024).toFixed(1)} KB</li>
                ))}
              </ul>
            )}
          </div>

          {/* Geo */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.geo.en} ur={L.geo.ur} />
              <input value={coords.lat && coords.lng ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "—"} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">{L.reset.en} / {L.reset.ur}</button>
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">{L.save.en} / {L.save.ur}</button>
          </div>
        </div>
      </form>
    </div>
  );
}