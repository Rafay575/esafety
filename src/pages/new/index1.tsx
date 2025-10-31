import React, { useMemo, useState } from "react";

/**
 * Canvas 3 – Safety Hazards where PTW is required (Single bilingual form)
 * English is primary; Urdu appears beside each hazard item. Desktop/tablet software screen.
 * You can add custom hazards and save a clean JSON payload.
 */

type Item = { key: string; en: string; ur: string };

type Group = { title: { en: string; ur: string }; items: Item[] };

const GROUPS: Group[] = [
  {
    title: { en: "Electrical", ur: "برقی" },
    items: [
      { key: "electricShock", en: "Electric shock", ur: "بجلی کا جھٹکا" },
      { key: "arcFlash", en: "Arc flash / arc blast", ur: "آرک فلیش / آرک بلاسٹ" },
      { key: "induction", en: "Induced voltage / capacitive charge", ur: "انڈکشن / کیپیسیٹو چارج" },
      { key: "adjacentLive", en: "Adjacent live parts", ur: "قریب زندہ حصے" },
      { key: "undergroundCable", en: "Underground cable present", ur: "انڈر گراؤنڈ کیبل کا خطرہ" },
    ],
  },
  {
    title: { en: "Work-at-Height / Mechanical", ur: "اونچائی / مکینیکل" },
    items: [
      { key: "fallFromHeight", en: "Fall from height", ur: "اونچائی سے گرنے کا خطرہ" },
      { key: "fallingObjects", en: "Falling tools/material", ur: "اوزار/سامان گرنے کا خطرہ" },
      { key: "ladderScaffold", en: "Unsafe ladder/scaffold", ur: "غیر محفوظ سیڑھی/اسکیفولڈ" },
      { key: "vehicleMovement", en: "Moving vehicles / machinery", ur: "چلتی گاڑیاں/مکینری" },
    ],
  },
  {
    title: { en: "Environment", ur: "ماحولیاتی" },
    items: [
      { key: "rainWet", en: "Rain / wet conditions", ur: "بارش / گیلاپن" },
      { key: "windStorm", en: "Wind / storm", ur: "تیز ہوا / آندھی" },
      { key: "heatSun", en: "Heat / sun exposure", ur: "گرمی / دھوپ" },
      { key: "gasVapors", en: "Toxic or flammable gas/vapors", ur: "زہریلی یا آتش گیر گیسیں" },
      { key: "waterInPits", en: "Standing water in pits/manholes", ur: "حفرہ/مین ہول میں پانی" },
      { key: "slipTrip", en: "Slip / trip hazards", ur: "پھسلنے / ٹھوکر کا خطرہ" },
    ],
  },
  {
    title: { en: "Public / Wildlife", ur: "عوام / جنگلی حیات" },
    items: [
      { key: "angryPublic", en: "Aggressive public / crowd", ur: "مشتعل عوام" },
      { key: "traffic", en: "Road traffic", ur: "سڑک کی ٹریفک" },
      { key: "snakesAnimals", en: "Snakes/monkeys/bees or wild animals", ur: "سانپ، بندر، مکھیاں یا جنگلی جانور" },
    ],
  },
];

export default function SafetyHazardsBilingual() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [custom, setCustom] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    setCustomList((list) => [...list, v]);
    setCustom("");
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      selected: Object.keys(selected).filter((k) => selected[k]),
      custom: customList,
      notes,
    };
    console.log("SAFETY_HAZARDS:", payload);
    alert("Saved. Check console for payload.");
  };

  const onReset = () => {
    setSelected({});
    setNotes("");
    setCustom("");
    setCustomList([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Checklist – Safety Hazards Where PTW is Required</h1>
            <p className="text-xs opacity-70" dir="rtl">چیک لسٹ — وہ حفاظتی خطرات جہاں پی ٹی ڈبلیو درکار ہے</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSave} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {GROUPS.map((g) => (
            <div key={g.title.en} className="mb-4">
              <div className="mb-2 text-sm font-semibold">
                {g.title.en}
                <span className="ml-2 text-xs opacity-70" dir="rtl">{g.title.ur}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {g.items.map((it) => (
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
          ))}

          {/* Custom hazard */}
          <div className="mt-3 rounded-xl border p-3">
            <div className="mb-2 text-sm font-medium">Custom Hazard <span className="ml-2 text-xs opacity-70" dir="rtl">اپنا خطرہ شامل کریں</span></div>
            <div className="flex gap-2">
              <input value={custom} onChange={(e)=>setCustom(e.target.value)} placeholder="Type a custom hazard / اپنا خطرہ لکھیں" className="flex-1 rounded-md border px-3 py-2"/>
              <button type="button" onClick={addCustom} className="rounded-md bg-blue-600 px-3 py-2 text-white">Add / شامل کریں</button>
            </div>
            {customList.length > 0 && (
              <ul className="mt-2 list-disc px-5 text-sm">
                {customList.map((c,i)=> (<li key={i}>{c}</li>))}
              </ul>
            )}
          </div>

          {/* Notes */}
          <div className="mt-3">
            <div className="mb-1 text-sm font-medium">Notes <span className="ml-2 text-xs opacity-70" dir="rtl">نوٹس</span></div>
            <textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full rounded-md border px-3 py-2"/>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Reset / ری سیٹ</button>
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">Save / محفوظ کریں</button>
          </div>
        </div>
      </form>
    </div>
  );
}