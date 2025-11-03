"use client";
import { AlertTriangle } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function StateError({
  message = "Something went wrong",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-red-500 dark:text-red-400">
      <AlertTriangle className="w-6 h-6 mb-3" />
      <p className="text-sm mb-3">Access Denied.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-4 py-2 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}
