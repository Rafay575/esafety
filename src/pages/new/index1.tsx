"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormSelect, FormTextarea } from "@/components/Base/Form";
import FormCheck from "@/components/Base/Form/FormCheck";
import FormLabel from "@/components/Base/Form/FormLabel";

type Item = { key: string; en: string; ur: string };
type Group = { title: { en: string; ur: string }; items: Item[] };

// --------- Updated groups & items (compact but practical) ---------
const GROUPS: Group[] = [
  {
    title: { en: "Electrical", ur: "برقی" },
    items: [
      { key: "electricShock", en: "Electric shock", ur: "بجلی کا جھٹکا" },
      { key: "arcFlash", en: "Arc flash / arc blast", ur: "آرک فلیش / آرک بلاسٹ" },
      { key: "induction", en: "Induced voltage / capacitive charge", ur: "انڈکشن / کیپیسیٹو چارج" },
      { key: "adjacentLive", en: "Adjacent live parts", ur: "قریب زندہ حصے" },
      { key: "undergroundCable", en: "Underground cable present", ur: "انڈر گراؤنڈ کیبل موجود" },
    ],
  },
  {
    title: { en: "Work at Height / Mechanical", ur: "اونچائی / مکینیکل" },
    items: [
      { key: "fallFromHeight", en: "Fall from height", ur: "اونچائی سے گرنے کا خطرہ" },
      { key: "fallingObjects", en: "Falling tools / material", ur: "اوزار / سامان گرنے کا خطرہ" },
      { key: "ladderScaffold", en: "Unsafe ladder / scaffold", ur: "غیر محفوظ سیڑھی / اسکیفولڈ" },
      { key: "vehicleMovement", en: "Moving vehicles / machinery", ur: "چلتی گاڑیاں / مکینری" },
    ],
  },
  {
    title: { en: "Environment", ur: "ماحولیاتی" },
    items: [
      { key: "rainWet", en: "Rain / wet conditions", ur: "بارش / گیلاپن" },
      { key: "windStorm", en: "Wind / storm", ur: "تیز ہوا / آندھی" },
      { key: "heatSun", en: "Heat / sun exposure", ur: "گرمی / دھوپ" },
      { key: "gasVapors", en: "Toxic / flammable gas or vapors", ur: "زہریلی / آتش گیر گیسیں" },
      { key: "waterInPits", en: "Water in pits / manholes", ur: "حفرہ / مین ہول میں پانی" },
      { key: "slipTrip", en: "Slip / trip hazards", ur: "پھسلنے / ٹھوکر کا خطرہ" },
    ],
  },
  {
    title: { en: "Public / Wildlife", ur: "عوام / جنگلی حیات" },
    items: [
      { key: "angryPublic", en: "Aggressive public / crowd", ur: "مشتعل عوام" },
      { key: "traffic", en: "Road traffic", ur: "سڑک کی ٹریفک" },
      { key: "animals", en: "Snakes / monkeys / bees / wild animals", ur: "سانپ، بندر، مکھیاں، جنگلی جانور" },
    ],
  },
];

// --------- Risk model ---------
const SEVERITIES = [
  { v: 1, label: "S1 – Minor" },
  { v: 2, label: "S2 – Moderate" },
  { v: 3, label: "S3 – Serious" },
  { v: 4, label: "S4 – Major" },
  { v: 5, label: "S5 – Catastrophic" },
];

const LIKELIHOODS = [
  { v: 1, label: "L1 – Rare" },
  { v: 2, label: "L2 – Unlikely" },
  { v: 3, label: "L3 – Possible" },
  { v: 4, label: "L4 – Likely" },
  { v: 5, label: "L5 – Frequent" },
];

function riskCategory(score: number) {
  if (score >= 16) return { name: "High", cls: "bg-red-100 text-red-700 border-red-300" };
  if (score >= 9) return { name: "Medium", cls: "bg-amber-100 text-amber-800 border-amber-300" };
  if (score >= 4) return { name: "Low", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  return { name: "Very Low", cls: "bg-slate-100 text-slate-700 border-slate-300" };
}

export default function SafetyHazardsBilingual() {
  // selection state
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [severity, setSeverity] = useState<Record<string, number>>({});
  const [likelihood, setLikelihood] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // custom hazards
  const [cEn, setCEn] = useState("");
  const [cUr, setCUr] = useState("");
  const [custom, setCustom] = useState<Item[]>([]);

  const allGroups: Group[] = useMemo(() => {
    return [
      ...GROUPS,
      ...(custom.length
        ? [{ title: { en: "Custom", ur: "حسبِ ضرورت" }, items: custom }]
        : []),
    ];
  }, [custom]);

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  const setSev = (k: string, v: number) => setSeverity((s) => ({ ...s, [k]: v }));
  const setLik = (k: string, v: number) => setLikelihood((s) => ({ ...s, [k]: v }));
  const setNote = (k: string, v: string) => setNotes((s) => ({ ...s, [k]: v }));

  const addCustomHazard = () => {
    const en = cEn.trim();
    const ur = cUr.trim();
    if (!en) return;
    const key = `custom_${Date.now()}`;
    const item = { key, en, ur: ur || en };
    setCustom((list) => [...list, item]);
    // prime new custom with defaults
    setSelected((s) => ({ ...s, [key]: true }));
    setSeverity((s) => ({ ...s, [key]: 3 }));
    setLikelihood((l) => ({ ...l, [key]: 3 }));
    setCEn("");
    setCUr("");
  };

  const removeCustom = (k: string) => {
    setCustom((list) => list.filter((i) => i.key !== k));
    setSelected(({ [k]: _, ...rest }) => rest);
    setSeverity(({ [k]: _s, ...rest }) => rest);
    setLikelihood(({ [k]: _l, ...rest }) => rest);
    setNotes(({ [k]: _n, ...rest }) => rest);
  };

  const clearAll = () => {
    setSelected({});
    setSeverity({});
    setLikelihood({});
    setNotes({});
    setCEn("");
    setCUr("");
    setCustom([]);
  };

  const computed = useMemo(() => {
    // collect selected hazards with score/category
    const entries: {
      key: string;
      en: string;
      ur: string;
      applied: boolean;
      severity?: number;
      likelihood?: number;
      score?: number;
      category?: string;
      note?: string;
    }[] = [];

    for (const g of allGroups) {
      for (const it of g.items) {
        const applied = !!selected[it.key];
        const sev = severity[it.key] ?? 3;
        const lik = likelihood[it.key] ?? 3;
        const score = sev * lik;
        const cat = riskCategory(score).name;
        entries.push({
          key: it.key,
          en: it.en,
          ur: it.ur,
          applied,
          severity: applied ? sev : undefined,
          likelihood: applied ? lik : undefined,
          score: applied ? score : undefined,
          category: applied ? cat : undefined,
          note: notes[it.key],
        });
      }
    }

    const selectedOnly = entries.filter((e) => e.applied);
    const maxScore = selectedOnly.reduce((m, e) => Math.max(m, e.score ?? 0), 0);
    const overall = riskCategory(maxScore).name;

    return { entries, selectedOnly, maxScore, overall };
  }, [allGroups, selected, severity, likelihood, notes]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      summary: {
        count: computed.selectedOnly.length,
        highestRiskScore: computed.maxScore,
        highestRiskCategory: computed.overall,
      },
      hazards: computed.selectedOnly.map((h) => ({
        key: h.key,
        en: h.en,
        ur: h.ur,
        severity: h.severity,
        likelihood: h.likelihood,
        score: h.score,
        category: h.category,
        note: h.note,
      })),
      timestamp: new Date().toISOString(),
    };
    console.log("SAFETY_HAZARDS_V2:", payload);
    alert("Saved. Check console for payload.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">
              Checklist – Safety Hazards Where PTW is Required
            </h1>
            <p className="text-xs opacity-70" dir="rtl">
              چیک لسٹ — وہ حفاظتی خطرات جہاں پی ٹی ڈبلیو درکار ہے
            </p>
          </div>

          {/* Overall badge */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="opacity-70">Overall Risk:</span>
            <span
              className={[
                "rounded-full border px-2.5 py-1 font-medium",
                riskCategory(computed.maxScore).cls,
              ].join(" ")}
            >
              {computed.overall}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={onSave} className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {allGroups.map((g) => (
            <div key={g.title.en} className="mb-6">
              <div className="mb-3 flex items-baseline justify-between">
                <div className="text-sm font-semibold">
                  {g.title.en}
                  <span className="ml-2 text-xs opacity-70" dir="rtl">
                    {g.title.ur}
                  </span>
                </div>
                {/* small count hint */}
                <div className="text-[11px] text-slate-500">
                  {
                    g.items.filter((it) => selected[it.key]).length
                  }{" "}
                  selected
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {g.items.map((it) => {
                  const applied = !!selected[it.key];
                  const sev = severity[it.key] ?? 3;
                  const lik = likelihood[it.key] ?? 3;
                  const score = sev * lik;
                  const cat = riskCategory(score);

                  return (
                    <div
                      key={it.key}
                      className={[
                        "rounded-xl border p-3 transition",
                        applied ? "border-primary/60 bg-primary/5" : "border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div
                        className="flex cursor-pointer items-start gap-3"
                        onClick={() => toggle(it.key)}
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
                            <div className="text-sm font-medium text-slate-800">
                              {it.en}
                            </div>
                            <div className="text-xs text-slate-600 opacity-80" dir="rtl">
                              {it.ur}
                            </div>
                          </FormCheck.Label>
                        </FormCheck>

                        {applied && (
                          <span
                            className={[
                              "ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              cat.cls,
                            ].join(" ")}
                            title={`Risk score: ${score}`}
                          >
                            {cat.name}
                          </span>
                        )}
                      </div>

                      {applied && (
                        <div className="mt-3 space-y-2">
                          {/* Severity & Likelihood */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <FormLabel className="text-xs">Severity / شدت</FormLabel>
                              <FormSelect
                                value={sev}
                                onChange={(e) => setSev(it.key, Number(e.target.value))}
                              >
                                {SEVERITIES.map((s) => (
                                  <option key={s.v} value={s.v}>
                                    {s.label}
                                  </option>
                                ))}
                              </FormSelect>
                            </div>
                            <div>
                              <FormLabel className="text-xs">Likelihood / امکان</FormLabel>
                              <FormSelect
                                value={lik}
                                onChange={(e) => setLik(it.key, Number(e.target.value))}
                              >
                                {LIKELIHOODS.map((l) => (
                                  <option key={l.v} value={l.v}>
                                    {l.label}
                                  </option>
                                ))}
                              </FormSelect>
                            </div>
                          </div>

                          {/* Note */}
                          <div>
                            <FormLabel className="text-xs">Note (optional) / نوٹ (اختیاری)</FormLabel>
                            <FormTextarea
                              rows={2}
                              value={notes[it.key] ?? ""}
                              onChange={(e) => setNote(it.key, e.target.value)}
                              placeholder="Detail the condition, location, or any temporary control..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom group inline remove buttons */}
              {g.title.en === "Custom" && g.items.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  You can remove a custom hazard by clicking the trash icon inside its card.
                </div>
              )}
            </div>
          ))}

          {/* Add Custom Hazard */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-semibold">
              Add Custom Hazard
              <span className="ml-2 text-xs opacity-70" dir="rtl">
                اپنا خطرہ شامل کریں
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <FormLabel>English</FormLabel>
                <FormTextarea
                  rows={2}
                  value={cEn}
                  onChange={(e) => setCEn(e.target.value)}
                  placeholder="e.g., Temporary generator backfeed risk"
                />
              </div>
              <div>
                <FormLabel>Urdu / اُردو</FormLabel>
                <FormTextarea
                  rows={2}
                  value={cUr}
                  onChange={(e) => setCUr(e.target.value)}
                  placeholder="مثلاً عارضی جنریٹر بیک فیڈ کا خطرہ"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Tip: Custom hazards are added with default S3×L3. You can adjust after adding.
              </div>
              <Button type="button" variant="primary" onClick={addCustomHazard}>
                Add / شامل کریں
              </Button>
            </div>

            {/* List custom with remove */}
            {custom.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                {custom.map((c) => (
                  <li
                    key={c.key}
                    className="flex items-start justify-between rounded-lg border p-2"
                  >
                    <div>
                      <div>{c.en}</div>
                      <div className="text-xs opacity-70" dir="rtl">
                        {c.ur}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustom(c.key)}
                      className="rounded-md px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                      title="Remove"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="text-xs text-slate-600">
              Selected: <b>{computed.selectedOnly.length}</b> &middot; Highest risk:{" "}
              <b>{computed.overall}</b>
            </div>
          
          </div>
        </div>
      </form>
    </div>
  );
}
