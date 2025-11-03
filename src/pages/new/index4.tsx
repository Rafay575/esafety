"use client";

import React, { useMemo, useRef, useState } from "react";
import Button from "@/components/Base/Button";
import FormCheck from "@/components/Base/Form/FormCheck";
import FormLabel from "@/components/Base/Form/FormLabel";

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
    en: "After supply is switched OFF, proceed only with permission from the LS-in-charge; do not act on your own.",
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
    en: "Do not start work on the line without written permission from the Sub-Division Officer; otherwise the LS and line staff will be responsible for any damage.",
    ur: "سب ڈویژن افسر کی تحریری اجازت کے بغیر لائن پر کام شروع نہ کریں؛ ورنہ نقصان کی صورت میں ایل ایس اور لائن اسٹاف ذمہ دار ہوں گے۔",
  },
  {
    en: "Do not use faulty tools or equipment; replace damaged PPE before work.",
    ur: "خراب اوزار یا سامان استعمال نہ کریں؛ خراب پی پی ای پہلے تبدیل کریں۔",
  },
  {
    en: "After completing work, inform the permit-issuing authority before restoration.",
    ur: "کام مکمل ہونے پر بحالی سے پہلے پرمٹ جاری کرنے والے متعلقہ افسر کو اطلاع دیں۔",
  },
  {
    en: "If any hazards are noticed at site, inform the control room/concerned office immediately.",
    ur: "اگر سائٹ پر کوئی خطرہ نظر آئے تو فوراً کنٹرول روم/متعلقہ دفتر کو اطلاع دیں۔",
  },
];

export default function LSInstructionsAckSoftware({next,back}:{next:()=>void,back:()=>void}) {
  const [ack, setAck] = useState(false);
  const [scrolledEnd, setScrolledEnd] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (atEnd) setScrolledEnd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
   
    const payload = {
      role: "Line Superintendent / Permit Receiver",
      acknowledged: true,
      scrolledEnd,
      timestamp: new Date().toISOString(),
    };
    console.log("✅ LS_ACK:", payload);
   next()
  };

  const handleReset = () => {
    setAck(false);
    setScrolledEnd(false);
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const percent = useMemo(() => (scrolledEnd ? 100 : 50), [scrolledEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex  items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">
              Instructions – Line Superintendent / Permit Receiver
            </h1>
            <p className="text-xs opacity-70" dir="rtl">
              ہدایات — لائن سپرنٹنڈنٹ / ورک پرمٹ وصول کنندہ
            </p>
          </div>
        
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto px-6 pb-20 pt-6">
        <div className="rounded-2xl border bg-white p-6 shadow-md">
          <FormLabel className="mb-3 text-sm font-semibold">
            Read carefully before starting work{" "}
            <span className="ml-2 text-xs opacity-70" dir="rtl">
              کام شروع کرنے سے پہلے توجہ سے پڑھیں
            </span>
          </FormLabel>

          {/* Scrollable Instructions */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className=" overflow-auto rounded-xl border bg-slate-50/50"
          >
            <ol className="list-decimal space-y-3 p-8 text-sm text-slate-800">
              {ITEMS.map((it, i) => (
                <li key={i} className="px-3">
                  <div>{it.en}</div>
                  <div className="text-xs text-slate-600 opacity-80" dir="rtl">
                    {it.ur}
                  </div>
                </li>
              ))}
            </ol>
          </div>

      

          <div className="flex justify-end gap-3 pt-4">
           <Button type="button" variant="outline-secondary" onClick={back}>
              Back / واپس جائیں
            </Button>
            <Button type="submit" variant="primary"  onClick={next}>
            Submit / جمع کروائیں
            </Button>
          </div>
        
        </div>
      </form>
    </div>
  );
}
