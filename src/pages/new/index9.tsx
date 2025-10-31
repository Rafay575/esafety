import React, { useEffect, useMemo, useState } from "react";

/**
 * PTW – Part A (Work Permit Receiver)
 * Single bilingual form: English is primary, and each field shows its Urdu translation beside/below it.
 * Inspired by the base design (pjra-ptw/add), but includes all required fields and behaviors.
 * TailwindCSS assumed; drop into a Next.js page.
 */

// ----------- Mock DB (replace with API) -----------
const DB = {
  circle: "Lahore",
  division: "Model Town",
  subDivision: "Gulberg Sub‑Division",
  feeders: [
    { name: "Feeder A‑11", incharge: "Mr. Imran", transformers: ["TX‑1001 (Pole 23)", "TX‑1006 (Span 24‑25)", "TX‑1010 (Chowk No. 3)"] },
    { name: "Feeder B‑07", incharge: "Mr. Sajid", transformers: ["TX‑2002 (Pole 9)", "TX‑2005 (Span 10‑11)", "TX‑2011 (Workshop Road)"] },
    { name: "Feeder C‑03", incharge: "Ms. Anum", transformers: ["TX‑3003 (Pole 44)", "TX‑3008 (Span 45‑46)"] },
  ],
};

// ---------- i18n (labels + Urdu translations) ----------
const L = {
  title: { en: "Work Permit (Permission to Work)", ur: "کام کرنے کا اجازت نامہ (ورک پرمٹ)" },
  partA: { en: "Part‑A: To be filled by the permit recipient", ur: "پہلا حصہ: یہ حصہ پرمٹ وصول کنندہ پُر کرے گا" },
  routine: { en: "Routine", ur: "معمول" },
  emergency: { en: "Emergency", ur: "ایمرجنسی" },
  date: { en: "Date", ur: "تاریخ" },
  formNo: { en: "Form No.", ur: "فارم نمبر" },
  wpNo: { en: "Work Permit No.", ur: "ورک پرمٹ نمبر" },
  subDiv: { en: "Sub‑Division / Department", ur: "سب ڈویژن / ڈپارٹمنٹ" },
  woNo: { en: "Work Order No.", ur: "ورک آرڈر نمبر" },
  lineOff: { en: "Feeder/line to be switched off", ur: "کون سا فیڈر/لائن بند کی جائے گی؟" },
  shutdownTime: { en: "Switch‑off Time", ur: "بجلی بند کرنے کا وقت" },
  restoreTime: { en: "Restore Time", ur: "بحالیِ بجلی کا وقت" },
  feederIncharge: { en: "Feeder In‑charge", ur: "فیڈر اِنچارج" },
  site: { en: "Place of Work / Site Location", ur: "کام کی جگہ / سائٹ لوکیشن" },
  assetId: { en: "Asset identification (pole/tower/transformer/overhead line/cable, etc.)", ur: "اثاثہ شناخت: کھمبا/ٹاور/ٹرانسفارمر/اوورہیڈ لائن/کیبل وغیرہ" },
  workDesc: { en: "Description / Scope of Work", ur: "کام کی تفصیل (اسکوپ)" },
  fieldVerify: { en: "Field verification (auto: circle/division, feeder, pole/tower no./span/location)", ur: "فیلڈ تصدیق (خودکار: سرکل/ڈویژن، فیڈر، کھمبا/ٹاور نمبر/اسپین/لوکیشن)" },
  shutdownSafe: { en: "Shutdown safety arrangements (earthing, barricading, danger plates, etc.)", ur: "شٹ ڈاؤن حفاظتی انتظامات (ارتھنگ، بیریکیڈنگ، ڈینجر پلیٹس وغیرہ)" },
  submit: { en: "Submit", ur: "جمع کریں" },
  reset: { en: "Reset", ur: "ری سیٹ" },
  prefilled: { en: "(Pre‑filled)", ur: "(خود بھر)" },
  readOnly: { en: "(Read‑only)", ur: "(صرف مطالعہ)" },
  searchFeeder: { en: "Search & select a feeder", ur: "فیڈر تلاش/منتخب کریں" },
  searchTransformer: { en: "Search & select a transformer", ur: "ٹرانسفارمر تلاش/منتخب کریں" },
};

type FormState = {
  type: "routine" | "emergency";
  formNo: string;
  date: string;
  wpNo: string;
  subDiv: string;
  woNo: string;
  lineOff: string; // feeder
  shutdownTime: string;
  restoreTime: string;
  feederIncharge: string;
  site: string; // transformer
  assetId: string;
  workDesc: string;
  fieldVerify: string;
  shutdownSafe: string;
};

export default function PTW_SingleForm_BilingualLabels() {
  const [form, setForm] = useState<FormState>({
    type: "routine",
    formNo: "4552", // pre‑filled
    date: "",
    wpNo: "WP‑2025‑001", // pre‑filled
    subDiv: DB.subDivision, // pre‑filled
    woNo: "WO‑8891", // pre‑filled
    lineOff: "",
    shutdownTime: "",
    restoreTime: "",
    feederIncharge: "",
    site: "",
    assetId: "",
    workDesc: "",
    fieldVerify: "",
    shutdownSafe: "",
  });

  const feeders = DB.feeders.map((f) => f.name);
  const transformers = useMemo(() => {
    const f = DB.feeders.find((x) => x.name === form.lineOff);
    return f ? f.transformers : [];
  }, [form.lineOff]);

  // auto-fill incharge + field verification
  useEffect(() => {
    const f = DB.feeders.find((x) => x.name === form.lineOff);
    const incharge = f?.incharge ?? "";
    const field = [
      `Circle: ${DB.circle}`,
      `Division: ${DB.division}`,
      form.subDiv ? `Sub‑Division: ${form.subDiv}` : "",
      form.lineOff ? `Feeder: ${form.lineOff}` : "",
      form.site ? `Location: ${form.site}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    setForm((prev) => ({ ...prev, feederIncharge: incharge, fieldVerify: field }));
  }, [form.lineOff, form.site, form.subDiv]);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    console.log("PART_A_PAYLOAD", payload);
    alert("Form valid. Check console for payload.");
  };
  const onReset = () => setForm((f) => ({ ...f, date: "", lineOff: "", shutdownTime: "", restoreTime: "", feederIncharge: "", site: "", assetId: "", workDesc: "", fieldVerify: "", shutdownSafe: "" }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{L.title.en} / {L.title.ur}</h1>
            <p className="text-xs opacity-70">{L.partA.en} — {L.partA.ur}</p>
          </div>
        </div>
      </div>

      {/* Body: ONE form with bilingual labels */}
      <form onSubmit={onSubmit} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {/* Type */}
          <Label en={`${L.routine.en} / ${L.emergency.en}`} ur={`${L.routine.ur} / ${L.emergency.ur}`} />
          <div className="mb-3 flex gap-6">
            <label className="text-sm"><input type="radio" checked={form.type === "routine"} onChange={() => setForm({ ...form, type: "routine" })} className="mr-2"/>{L.routine.en}</label>
            <label className="text-sm"><input type="radio" checked={form.type === "emergency"} onChange={() => setForm({ ...form, type: "emergency" })} className="mr-2"/>{L.emergency.en}</label>
          </div>

          {/* Row: Form no / Date */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label en={`${L.formNo.en} ${L.prefilled.en}`} ur={`${L.formNo.ur} ${L.prefilled.ur}`} />
              <input value={form.formNo} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
            <div>
              <Label en={L.date.en} ur={L.date.ur} />
              <input type="date" value={form.date} onChange={(e)=>setForm({ ...form, date: e.target.value })} className="w-full rounded-md border px-3 py-2"/>
            </div>
          </div>

          {/* Pre‑filled trio */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label en={`${L.wpNo.en} ${L.prefilled.en}`} ur={`${L.wpNo.ur} ${L.prefilled.ur}`} />
              <input value={form.wpNo} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
            <div>
              <Label en={`${L.subDiv.en} ${L.prefilled.en}`} ur={`${L.subDiv.ur} ${L.prefilled.ur}`} />
              <input value={form.subDiv} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
            <div>
              <Label en={`${L.woNo.en} ${L.prefilled.en}`} ur={`${L.woNo.ur} ${L.prefilled.ur}`} />
              <input value={form.woNo} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
          </div>

          {/* Feeder */}
          <div className="mt-3">
            <Label en={L.lineOff.en} ur={L.lineOff.ur} required />
            <input list="feederEN" value={form.lineOff} onChange={(e)=>setForm({ ...form, lineOff: e.target.value })} placeholder={`${L.searchFeeder.en} / ${L.searchFeeder.ur}`} className="w-full rounded-md border px-3 py-2"/>
            <datalist id="feederEN">{feeders.map((f)=>(<option key={f} value={f}/>))}</datalist>
          </div>

          {/* Times */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={L.shutdownTime.en} ur={L.shutdownTime.ur} />
              <input type="time" value={form.shutdownTime} onChange={(e)=>setForm({ ...form, shutdownTime: e.target.value })} className="w-full rounded-md border px-3 py-2"/>
            </div>
            <div>
              <Label en={L.restoreTime.en} ur={L.restoreTime.ur} />
              <input type="time" value={form.restoreTime} onChange={(e)=>setForm({ ...form, restoreTime: e.target.value })} className="w-full rounded-md border px-3 py-2"/>
            </div>
          </div>

          {/* Auto fields */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label en={`${L.feederIncharge.en} ${L.prefilled.en} ${L.readOnly.en}`} ur={`${L.feederIncharge.ur} ${L.prefilled.ur} ${L.readOnly.ur}`} />
              <input value={form.feederIncharge} readOnly className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
            </div>
            <div>
              <Label en={L.site.en} ur={L.site.ur} />
              <input list="txEN" value={form.site} onChange={(e)=>setForm({ ...form, site: e.target.value })} placeholder={`${L.searchTransformer.en} / ${L.searchTransformer.ur}`} className="w-full rounded-md border px-3 py-2" disabled={!form.lineOff}/>
              <datalist id="txEN">{transformers.map((t)=>(<option key={t} value={t}/>))}</datalist>
            </div>
          </div>

          {/* Free text */}
          <div className="mt-3">
            <Label en={L.assetId.en} ur={L.assetId.ur} />
            <input value={form.assetId} onChange={(e)=>setForm({ ...form, assetId: e.target.value })} className="w-full rounded-md border px-3 py-2"/>
          </div>
          <div className="mt-3">
            <Label en={L.workDesc.en} ur={L.workDesc.ur} />
            <textarea rows={3} value={form.workDesc} onChange={(e)=>setForm({ ...form, workDesc: e.target.value })} className="w-full rounded-md border px-3 py-2"/>
          </div>
          <div className="mt-3">
            <Label en={`${L.fieldVerify.en} ${L.readOnly.en}`} ur={`${L.fieldVerify.ur} ${L.readOnly.ur}`} />
            <textarea rows={3} readOnly value={form.fieldVerify} className="w-full rounded-md border px-3 py-2 bg-gray-50"/>
          </div>
          <div className="mt-3">
            <Label en={L.shutdownSafe.en} ur={L.shutdownSafe.ur} />
            <textarea rows={3} value={form.shutdownSafe} onChange={(e)=>setForm({ ...form, shutdownSafe: e.target.value })} className="w-full rounded-md border px-3 py-2"/>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">{L.reset.en} / {L.reset.ur}</button>
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">{L.submit.en} / {L.submit.ur}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
