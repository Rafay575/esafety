"use client";
import { Inbox } from "lucide-react";

export default function StateEmpty({
  message = "No records found",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
      <Inbox className="w-6 h-6 mb-3 text-slate-400" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
