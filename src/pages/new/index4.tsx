import React, { useMemo, useRef, useState } from "react";

/**
 * Canvas 5 – Instructions for Line Superintendent / Permit Receiver + Acknowledgment
 * Single bilingual form (EN primary, Urdu alongside each line). Desktop/tablet software screen.
 * Requires acknowledgment before submission; logs a clean payload.
 */

const ITEMS = [
  {
    en: "Complete LOTO/shutdown and obtain the work permit before starting any job.",
    ur: "کام شروع کرنے سے پہلے LOTO/شٹ ڈاؤن مکمل کریں اور ورک پرمٹ حاصل کریں۔",
  },
  {
    en: "Obtain a separate permit for each different site or job.",
    ur: "ہر مختلف جگہ یا کام کے لیے الگ پرمٹ حاصل کریں۔",
  },
  {
    en: "After supply is switched OFF, proceed only with permission from the LS‑in‑charge; do not act on your own.",
    ur: "سپلائی بند ہونے کے بعد صرف ایل ایس اِنچارج کی اجازت سے کام کریں؛ خود سے اقدام نہ کریں۔",
  },
  {
    en: "Brief all staff on the job method, hazards, and safety measures before starting work.",
    ur: "کام شروع کرنے سے پہلے تمام عملے کو طریقہ کار، خطرات اور حفاظتی اقدامات بتائیں۔",
  },
  {
    en: "If abnormal/unsafe conditions are observed, STOP work and inform the supervisor immediately.",
    ur: "غیر معمولی/غیر محفوظ حالت نظر آئے تو فوراً کام روکیں اور افسر کو اطلاع دیں۔",
  },
  {
    en: "After switching OFF, test the line to confirm it is dead before touching.",
    ur: "سپلائی بند کرنے کے بعد لائن کو ٹیسٹ کر کے ڈیڈ ہونے کی تصدیق کریں۔",
  },
  {
    en: "Do not start work on the line without written permission from the Sub‑Division Officer; otherwise the LS and line staff will be responsible for any damage.",
    ur: "سب ڈویژن افسر کی تحریری اجازت کے بغیر لائن پر کام شروع نہ کریں؛ ورنہ نقصان کی صورت میں ایل ایس اور لائن اسٹاف ذمہ دار ہوں گے۔",
  },
  {
    en: "Do not use faulty tools or equipment; replace damaged PPE before work.",
    ur: "خراب اوزار یا سامان استعمال نہ کریں؛ خراب پی پی ای پہلے تبدیل کریں۔",
  },
  {
    en: "After completing work, inform the permit‑issuing authority before restoration.",
    ur: "کام مکمل ہونے پر بحالی سے پہلے پرمٹ جاری کرنے والے متعلقہ افسر کو اطلاع دیں۔",
  },
  {
    en: "If any hazards are noticed at site, inform the control room/concerned office immediately.",
    ur: "اگر سائٹ پر کوئی خطرہ نظر آئے تو فوراً کنٹرول روم/متعلقہ دفتر کو اطلاع دیں۔",
  },
];

export default function LSInstructionsAckSoftware() {
  const [ack, setAck] = useState(false);
  const [scrolledEnd, setScrolledEnd] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (atEnd) setScrolledEnd(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ack) {
      alert("Please accept the acknowledgment.");
      return;
    }
    const payload = {
      role: "Line Superintendent / Permit Receiver",
      acknowledged: true,
      scrolledEnd,
      timestamp: new Date().toISOString(),
    };
    console.log("LS_ACK:", payload);
    alert("Acknowledgment submitted. Check console.");
  };

  const onReset = () => { setAck(false); setScrolledEnd(false); listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Instructions – Line Superintendent / Permit Receiver</h1>
            <p className="text-xs opacity-70" dir="rtl">ہدایات — لائن سپرنٹنڈنٹ / ورک پرمٹ وصول کنندہ</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-4xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Read carefully before starting work <span className="ml-2 text-xs opacity-70" dir="rtl">کام شروع کرنے سے پہلے توجہ سے پڑھیں</span></div>

          {/* Scrollable list to encourage reading */}
          <div ref={listRef} onScroll={handleScroll} className="max-h-72 overflow-auto rounded-lg border">
            <ol className="list-decimal space-y-3 p-4">
              {ITEMS.map((it, i) => (
                <li key={i} className="text-sm">
                  <div>{it.en}</div>
                  <div className="text-xs opacity-70" dir="rtl">{it.ur}</div>
                </li>
              ))}
            </ol>
          </div>
          {!scrolledEnd && (
            <div className="mt-2 text-xs text-amber-700">Scroll to the end to enable acknowledgment. <span className="ml-1" dir="rtl">آخر تک اسکرول کریں تاکہ تصدیق فعال ہو</span></div>
          )}

          {/* Acknowledgment */}
          <label className="mt-4 flex items-start gap-3 rounded-xl border bg-white p-3 text-sm shadow-sm">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={ack} disabled={!scrolledEnd} onChange={(e)=>setAck(e.target.checked)} />
            <span>
              I have read and will adhere to the above instructions.
              <span className="ml-2 text-xs opacity-70" dir="rtl">میں نے اوپر دی گئی ہدایات پڑھ لیں اور ان پر عمل کروں گا/گی</span>
            </span>
          </label>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Reset / ری سیٹ</button>
            <button type="submit" disabled={!ack} className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:opacity-50">Submit Acknowledgment / تصدیق جمع کریں</button>
          </div>
        </div>
      </form>
    </div>
  );
}