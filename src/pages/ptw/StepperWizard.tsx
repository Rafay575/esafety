"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ActivitySquare,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Button from "@/components/Base/Button";

import PTW_SingleForm_BilingualLabels from "../new/index9";
import SituationOfLineBilingual from "../new";
import SafetyHazardsBilingual from "../new/index1";
import SafetyPrecautionsWizardBilingual from "../new/index2";
import LSInstructionsAckSoftware from "../new/index4";

const STEPS = [
  { id: 1, title: "Part A – Basic Information", ur: "حصہ اوّل – بنیادی معلومات", icon: ClipboardList },
  { id: 2, title: "Situation of Line", ur: "لائن کی صورتحال", icon: ActivitySquare },
  { id: 3, title: "Safety Hazards", ur: "حفاظتی خطرات", icon: ShieldAlert },
  { id: 4, title: "Safety Precautions", ur: "حفاظتی اقدامات", icon: ShieldCheck },
  { id: 5, title: "LS Instructions & Acknowledgment", ur: "ایل ایس ہدایات و تصدیق", icon: UserCheck },
] as const;

export default function PTW_StepperWizardFinal() {
  const [step, setStep] = useState<number>(1);
  const percent = useMemo(() => Math.round((step / STEPS.length) * 100), [step]);
  const current = useMemo(() => STEPS.find((s) => s.id === step)!, [step]);
  const next = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const onFinish = () => alert("✅ All steps completed successfully!");

  const renderStep = () => {
    switch (step) {
      case 1: return <PTW_SingleForm_BilingualLabels />;
      case 2: return <SituationOfLineBilingual />;
      case 3: return <SafetyHazardsBilingual />;
      case 4: return <SafetyPrecautionsWizardBilingual />;
      case 5: return <LSInstructionsAckSoftware />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br mt-5 from-slate-100 via-slate-50 to-white  shadow-lg">
      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 flex items-center gap-2">
              <span className="text-primary font-bold">PTW</span> Step {step} / {STEPS.length}
            </h1>
            <p className="text-xs text-slate-500" dir="rtl">
              ورک پرمٹ – مرحلہ {step} از {STEPS.length}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-3 md:mt-0 w-full md:w-72">
            <div className="relative h-2 overflow-hidden rounded-full bg-slate-200/60">
              <motion.div
                className="absolute left-0 top-0 h-2 bg-primary "
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] font-medium text-slate-600">
              {percent}% Complete
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mx-auto flex max-w-6xl justify-between px-4 pb-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex flex-col items-center text-center w-1/5 group">
                <div
                  className={`flex items-center justify-center rounded-full border-2 w-10 h-10 transition-all duration-300 ${
                    done
                      ? "border-green-500 bg-green-100 text-green-700"
                      : active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-300 text-slate-400 group-hover:border-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p
                  className={`mt-2 text-[11px] font-medium leading-tight ${
                    active
                      ? "text-primary"
                      : done
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  {s.title}
                </p>
              </div>
            );
          })}
        </div>
      </header>

      {/* ---------- BODY ---------- */}
      <main className="relative mx-auto max-w-6xl px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border bg-white/90 backdrop-blur shadow-md ring-1 ring-slate-100 overflow-hidden"
          >
            <div className="p-4 md:p-6">{renderStep()}</div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---------- FOOTER (Restored Original Layout) ---------- */}
      <footer className="mt-8 sticky bottom-0 z-50 border-t bg-white">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between px-6 py-3 gap-3">
          {/* Urdu label left side */}
          <div className="text-xs text-slate-600" dir="rtl">
            {current.ur}
          </div>

          {/* Navigation buttons right side */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              disabled={step === 1}
              onClick={back}
            >
              ← Back / پچھلا
            </Button>

            {step < STEPS.length ? (
              <Button type="button" variant="primary" onClick={next}>
                Next / اگلا →
              </Button>
            ) : (
              <Button type="button" variant="success" onClick={onFinish}>
                Submit All / مکمل جمع کریں
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
