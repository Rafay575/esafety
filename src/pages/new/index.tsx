import React, { useMemo, useState } from "react";

/**
 * Canvas 2 – Situation of Line where PTW is required (Single bilingual form)
 * English is primary; Urdu appears beside each item. Desktop/tablet software screen (no phone frame).
 * Items grouped per the scanned form + your earlier notes.
 */

type Item = {
  key: string;
  en: string;
  ur: string;
};

type Group = {
  title: { en: string; ur: string };
  items: Item[];
};

const GROUPS: Group[] = [
  {
    title: { en: "Voltage / Class", ur: "وولٹیج / درجہ" },
    items: [
      { key: "lt400", en: "LT line (up to 400 V)", ur: "لو وولٹیج لائن (400 وولٹ تک)" },
      { key: "ht1133", en: "HT line (11 / 33 kV)", ur: "ایچ ٹی لائن (11 / 33 کلو وولٹ)" },
    ],
  },
  {
    title: { en: "Status", ur: "حالت" },
    items: [
      { key: "dead", en: "Line dead / isolated", ur: "لائن ڈیڈ / آئسولیٹڈ" },
      { key: "live", en: "Line energized / live", ur: "لائن اینرجائزڈ / چل رہی ہے" },
      { key: "fed", en: "Feeder is back‑feed / being fed", ur: "فیڈر بیک فیڈ یا فیڈ ہے" },
    ],
  },
  {
    title: { en: "Construction Type", ur: "تعمیر کی قسم" },
    items: [
      { key: "oh", en: "Overhead line", ur: "اوور ہیڈ لائن" },
      { key: "ug", en: "Underground cable", ur: "زیر زمین کیبل" },
      { key: "dt", en: "Distribution / Transmission line", ur: "ڈسٹری بیوشن / ٹرانسمیشن لائن" },
    ],
  },
  {
    title: { en: "Other Conditions", ur: "دیگر حالات" },
    items: [
      { key: "streetLight", en: "Street lights are ON", ur: "سٹریٹ لائٹس آن ہیں" },
    ],
  },
];

export default function SituationOfLineBilingual() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      selected: Object.keys(selected).filter((k) => selected[k]),
      notes,
    };
    console.log("SITUATION_OF_LINE:", payload);
    alert("Saved. Check console for payload.");
  };

  const onReset = () => {
    setSelected({});
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Checklist – Situation of Line where PTW is required</h1>
            <p className="text-xs opacity-70" dir="rtl">پی ٹی ڈبلیو درکار ہونے کی صورت میں لائن کی صورتحال — چیک لسٹ</p>
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
