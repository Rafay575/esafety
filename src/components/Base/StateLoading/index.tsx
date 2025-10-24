"use client";
import { Loader2 } from "lucide-react";

export default function StateLoading({
  message = "Loading data...",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-6 h-6 mb-3 animate-spin text-primary" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
