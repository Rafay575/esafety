import React, { useRef, useState } from "react";

/**
 * Canvas 7 – Work Permit Issuer: Instructions + Acknowledgment (Software screen)
 * Single bilingual form: English primary with Urdu alongside each line.
 * Scroll-to-end gate before the acknowledgment checkbox enables.
 */

const ITEMS = [
  {
    en: "If a mobile phone shutdown or system shutdown is in progress and any accident occurs before supply restoration or permit cancellation, the grid staff will be responsible.",
    ur: "اگر موبائل فون پر شٹ ڈاؤن یا سسٹم شٹ ڈاؤن جاری ہو اور بحالیِ سپلائی یا پرمٹ منسوخی سے پہلے کوئی حادثہ ہو تو گرڈ عملہ ذمہ دار ہوگا۔",
  },
  {
    en: "Before restoring supply, ensure all related feeders are shut and obtain the permit receiver's acknowledgment that locks and tags are in place.",
    ur: "سپلائی بحال کرنے سے پہلے تمام متعلقہ فیڈرز بند ہوں اور ورک پرمٹ وصول کنندہ سے اس بات کی تصدیق لی جائے کہ لاک اور ٹیگ لگے ہوئے ہیں۔",
  },
  {
    en: "On shift change, brief the incoming grid staff on all issued permits and record locks/tags in the log book.",
    ur: "شفٹ تبدیلی پر آنے والے گرڈ عملے کو تمام جاری پرمٹس سے آگاہ کریں اور لاک/ٹیگ کی تفصیل لاگ بُک میں درج کریں۔",
  },
];

export default function IssuerInstructionsAck_Software() {
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
      role: "PTW Issuer",
      acknowledged: true,
      scrolledEnd,
      timestamp: new Date().toISOString(),
    };
    console.log("ISSUER_ACK_PAYLOAD", payload);
    alert("Acknowledgment submitted. See console.");
  };

  const onReset = () => { setAck(false); setScrolledEnd(false); listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Instructions – PTW Issuer</h1>
            <p className="text-xs opacity-70" dir="rtl">ہدایات — ورک پرمٹ جاری کنندہ</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-4xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Read carefully and accept before issuing the PTW <span className="ml-2 text-xs opacity-70" dir="rtl">پرمٹ جاری کرنے سے پہلے غور سے پڑھیں اور قبول کریں</span></div>

          {/* Scrollable list */}
          <div ref={listRef} onScroll={handleScroll} className="max-h-60 overflow-auto rounded-lg border">
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
              I have read, understood, and accept these instructions as the PTW Issuer.
              <span className="ml-2 text-xs opacity-70" dir="rtl">میں بطور ورک پرمٹ جاری کنندہ ان ہدایات کو پڑھ کر سمجھ چکا/چکی ہوں اور قبول کرتا/کرتی ہوں</span>
            </span>
          </label>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Reset / ری سیٹ</button>
            <button type="submit" disabled={!ack} className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:opacity-50">Accept & Acknowledge / قبول کریں اور تصدیق دیں</button>
          </div>
        </div>
      </form>
    </div>
  );
}