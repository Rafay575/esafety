"use client";

import React from "react";
import clsx from "clsx";
import Popover from "@/components/Base/Headless/Popover";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormSelect, FormSwitch } from "@/components/Base/Form";
import StateLoading from "@/components/Base/StateLoading";
import StateEmpty from "@/components/Base/StateEmpty";
import StateError from "@/components/Base/StateError";
import ActionPopover from "../ActionPopover";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon?:
    | "Eye"
    | "PencilLine"
    | "Trash2"
    | "Edit"
    | "Settings"
    | "MoreHorizontal";
  onClick: (row: T) => void;
  variant?: "default" | "danger";
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  actions?: TableAction<T>[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  toolbarActions?: React.ReactNode;

  // 🔹 API-driven pagination & search
  page: number;
  perPage: number;
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function GenericTable<T extends Record<string, any>>({
  data,
  columns,
  title = "Listing",
  actions = [],
  loading = false,
  error = null,
  onRetry,
  toolbarActions,
  page,
  perPage,
  total,
  search,
  onSearchChange,
  onPageChange,
  onPerPageChange,
}: GenericTableProps<T>) {
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="w-full intro-y rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
          <FormInput
            className="w-64"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <FormSelect
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="w-24"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </FormSelect>

          {toolbarActions && toolbarActions}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center w-[60px]">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={clsx(
                    "px-6 py-3 font-medium text-xs uppercase tracking-wider",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center w-[60px]">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <StateLoading message="Loading records..." />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <StateError message={error} onRetry={onRetry} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <StateEmpty message="No records found." />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="px-6 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                    {(page - 1) * perPage + index + 1}
                  </td>

                  {columns.map((col) => {
                    const key = String(col.key);
                    const value = row[key as keyof T];

                    return (
                      <td
                        key={key}
                        className={clsx(
                          "px-6 py-3 text-slate-700 dark:text-slate-300",
                          col.className,
                        )}
                      >
                        {col.render ? col.render(row, index) : (value as any)}
                      </td>
                    );
                  })}

                 {actions.length > 0 && (
  <td className="px-6 py-3 text-center">
    <div className="flex items-center justify-center gap-2">
      {actions.map((action) => {
        // Create the button/link element based on whether it has href
        const commonProps = {
          key: action.label,
          onTouchEnd: (e) => {
            e.preventDefault(); // Prevent double-tap zoom
            if (action.onClick) action.onClick(row);
          },
          className: clsx(
            "p-2 rounded-md transition-colors flex items-center justify-center",
            action.variant === "danger"
              ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          ),
          title: action.label, // Tooltip for accessibility
        };

        // If action has href, create an anchor link
        if (action.href) {
          return (
            <a
              {...commonProps}
              href={action.href}
              target={action.target || "_self"}
              rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                // If there's also an onClick handler
                if (action.onClick) {
                  e.preventDefault();
                  action.onClick(row);
                }
              }}
            >
              <Lucide icon={action.icon} className="w-4 h-4" />
            </a>
          );
        }

        // Otherwise create a button with onClick
        return (
          <button
            {...commonProps}
            onClick={() => action.onClick?.(row)}
          >
            <Lucide icon={action.icon} className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  </td>
)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION FOOTER --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {data.length ? (page - 1) * perPage + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {(page - 1) * perPage + data.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {total}
          </span>{" "}
          entries
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span className="px-2 text-xs text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
