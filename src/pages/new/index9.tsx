"use client";

import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import FormCheck from "@/components/Base/Form/FormCheck";
import FormLabel from "@/components/Base/Form/FormLabel"; // ✅ added

const DB = {
  circle: "Lahore",
  division: "Model Town",
  subDivision: "Gulberg Sub-Division",
  feeders: [
    {
      name: "Feeder A-11",
      incharge: "Mr. Imran",
      transformers: [
        "TX-1001 (Pole 23)",
        "TX-1006 (Span 24-25)",
        "TX-1010 (Chowk No. 3)",
      ],
    },
    {
      name: "Feeder B-07",
      incharge: "Mr. Sajid",
      transformers: [
        "TX-2002 (Pole 9)",
        "TX-2005 (Span 10-11)",
        "TX-2011 (Workshop Road)",
      ],
    },
    {
      name: "Feeder C-03",
      incharge: "Ms. Anum",
      transformers: ["TX-3003 (Pole 44)", "TX-3008 (Span 45-46)"],
    },
  ],
};

// ---------- i18n ----------
const L = {
  title: { en: "Work Permit (Permission to Work)", ur: "کام کرنے کا اجازت نامہ (ورک پرمٹ)" },
  partA: { en: "Part-A: To be filled by the permit recipient", ur: "پہلا حصہ: یہ حصہ پرمٹ وصول کنندہ پُر کرے گا" },
  routine: { en: "Routine", ur: "معمول" },
  emergency: { en: "Emergency", ur: "ایمرجنسی" },
  date: { en: "Date", ur: "تاریخ" },
  formNo: { en: "Form No.", ur: "فارم نمبر" },
  wpNo: { en: "Work Permit No.", ur: "ورک پرمٹ نمبر" },
  subDiv: { en: "Sub-Division / Department", ur: "سب ڈویژن / ڈپارٹمنٹ" },
  woNo: { en: "Work Order No.", ur: "ورک آرڈر نمبر" },
  lineOff: { en: "Feeder / Line to be switched off", ur: "کون سا فیڈر/لائن بند کی جائے گی؟" },
  shutdownTime: { en: "Electricity Off Time", ur: "بجلی بند کرنے کا وقت" },
  restoreTime: { en: "Electricity On Time", ur: "بحالیِ بجلی کا وقت" },
  feederIncharge: { en: "Feeder In-Charge", ur: "فیڈر اِنچارج" },
  site: { en: "Work Location / Site", ur: "کام کی جگہ / سائٹ" },
  assetId: { en: "Asset Identification", ur: "اثاثہ شناخت" },
  workDesc: { en: "Work Description / Scope", ur: "کام کی تفصیل" },
  fieldVerify: { en: "Field Verification", ur: "فیلڈ تصدیق" },
  shutdownSafe: { en: "Shutdown Safety Arrangements", ur: "شٹ ڈاؤن حفاظتی انتظامات" },
  submit: { en: "Submit", ur: "جمع کریں" },
  reset: { en: "Reset", ur: "ری سیٹ" },
  prefilled: { en: "(Pre-filled)", ur: "(خود بھر)" },
  readOnly: { en: "(Read-only)", ur: "(صرف مطالعہ)" },
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
  lineOff: string;
  shutdownTime: string;
  restoreTime: string;
  feederIncharge: string;
  site: string;
  assetId: string;
  workDesc: string;
  fieldVerify: string;
  shutdownSafe: string;
};

export default function PTW_SingleForm_BilingualLabels() {
  const [form, setForm] = useState<FormState>({
    type: "routine",
    formNo: "4552",
    date: "",
    wpNo: "WP-2025-001",
    subDiv: DB.subDivision,
    woNo: "WO-8891",
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

  useEffect(() => {
    const f = DB.feeders.find((x) => x.name === form.lineOff);
    const incharge = f?.incharge ?? "";
    const field = [
      `Circle: ${DB.circle}`,
      `Division: ${DB.division}`,
      form.subDiv ? `Sub-Division: ${form.subDiv}` : "",
      form.lineOff ? `Feeder: ${form.lineOff}` : "",
      form.site ? `Location: ${form.site}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    setForm((prev) => ({
      ...prev,
      feederIncharge: incharge,
      fieldVerify: field,
    }));
  }, [form.lineOff, form.site, form.subDiv]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("PART_A_PAYLOAD", form);
    alert("Form submitted. Check console for payload.");
  };

  const onReset = () =>
    setForm((f) => ({
      ...f,
      date: "",
      lineOff: "",
      shutdownTime: "",
      restoreTime: "",
      feederIncharge: "",
      site: "",
      assetId: "",
      workDesc: "",
      fieldVerify: "",
      shutdownSafe: "",
    }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">
              {L.title.en} / {L.title.ur}
            </h1>
            <p className="text-xs opacity-70">
              {L.partA.en} — {L.partA.ur}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          {/* Type */}
          <FormLabel className="flex justify-between">
            <span>{`${L.routine.en} / ${L.emergency.en}`}</span>
            <span className="text-xs opacity-70" dir="rtl">
              {`${L.routine.ur} / ${L.emergency.ur}`}
            </span>
          </FormLabel>
          <div className="flex gap-6 mb-4">
            <FormCheck>
              <FormCheck.Input
                type="radio"
                checked={form.type === "routine"}
                onChange={() => setForm({ ...form, type: "routine" })}
              />
              <FormCheck.Label>{L.routine.en}</FormCheck.Label>
            </FormCheck>
            <FormCheck>
              <FormCheck.Input
                type="radio"
                checked={form.type === "emergency"}
                onChange={() => setForm({ ...form, type: "emergency" })}
              />
              <FormCheck.Label >{L.emergency.en}</FormCheck.Label>
            </FormCheck>
          </div>

          {/* Form No / Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel className="flex justify-between">
                <span>{`${L.formNo.en} ${L.prefilled.en}`}</span>
                <span className="text-xs opacity-70" dir="rtl">{`${L.formNo.ur} ${L.prefilled.ur}`}</span>
              </FormLabel>
              <FormInput value={form.formNo} readOnly />
            </div>
            <div>
              <FormLabel className="flex justify-between">
                <span>{L.date.en}</span>
                <span className="text-xs opacity-70" dir="rtl">{L.date.ur}</span>
              </FormLabel>
              <FormInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          {/* Prefilled Trio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FormLabel>{`${L.wpNo.en} / ${L.wpNo.ur}`}</FormLabel>
              <FormInput value={form.wpNo} readOnly />
            </div>
            <div>
              <FormLabel>{`${L.subDiv.en} / ${L.subDiv.ur}`}</FormLabel>
              <FormInput value={form.subDiv} readOnly />
            </div>
            <div>
              <FormLabel>{`${L.woNo.en} / ${L.woNo.ur}`}</FormLabel>
              <FormInput value={form.woNo} readOnly />
            </div>
          </div>

          {/* Feeder Select */}
          <div>
            <FormLabel className="flex justify-between">
              <span>{L.lineOff.en}</span>
              <span className="text-xs opacity-70" dir="rtl">{L.lineOff.ur}</span>
            </FormLabel>
            <FormSelect value={form.lineOff} onChange={(e) => setForm({ ...form, lineOff: e.target.value })}>
              <option value="">{`${L.searchFeeder.en} / ${L.searchFeeder.ur}`}</option>
              {feeders.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </FormSelect>
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>{`${L.shutdownTime.en} / ${L.shutdownTime.ur}`}</FormLabel>
              <FormInput
                type="time"
                value={form.shutdownTime}
                onChange={(e) => setForm({ ...form, shutdownTime: e.target.value })}
              />
            </div>
            <div>
              <FormLabel>{`${L.restoreTime.en} / ${L.restoreTime.ur}`}</FormLabel>
              <FormInput
                type="time"
                value={form.restoreTime}
                onChange={(e) => setForm({ ...form, restoreTime: e.target.value })}
              />
            </div>
          </div>

          {/* Auto & Transformer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>{`${L.feederIncharge.en} / ${L.feederIncharge.ur}`}</FormLabel>
              <FormInput readOnly value={form.feederIncharge} />
            </div>
            <div>
              <FormLabel>{`${L.site.en} / ${L.site.ur}`}</FormLabel>
              <FormSelect
                disabled={!form.lineOff}
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
              >
                <option value="">{`${L.searchTransformer.en} / ${L.searchTransformer.ur}`}</option>
                {transformers.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </FormSelect>
            </div>
          </div>

          {/* Text Areas */}
          <div>
            <FormLabel>{`${L.assetId.en} / ${L.assetId.ur}`}</FormLabel>
            <FormInput value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} />
          </div>
          <div>
            <FormLabel>{`${L.workDesc.en} / ${L.workDesc.ur}`}</FormLabel>
            <FormTextarea
              rows={3}
              value={form.workDesc}
              onChange={(e) => setForm({ ...form, workDesc: e.target.value })}
            />
          </div>
          <div>
            <FormLabel>{`${L.fieldVerify.en} / ${L.fieldVerify.ur}`}</FormLabel>
            <FormTextarea rows={3} readOnly value={form.fieldVerify} />
          </div>
          <div>
            <FormLabel>{`${L.shutdownSafe.en} / ${L.shutdownSafe.ur}`}</FormLabel>
            <FormTextarea
              rows={3}
              value={form.shutdownSafe}
              onChange={(e) => setForm({ ...form, shutdownSafe: e.target.value })}
            />
          </div>

          {/* Buttons */}
        
        </div>
      </form>
    </div>
  );
}
