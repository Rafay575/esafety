"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, Search, X } from "lucide-react";

export type SearchSelectItem = {
  id: number | string;
  label: string;
  subLabel?: string;
};

type Props = {
  label?: string;
  helperText?: string;
  placeholder?: string;

  items: SearchSelectItem[];

  // SINGLE
  value?: number | string | null;
  onChange?: (val: number | string | null, item?: SearchSelectItem) => void;

  // MULTI
  multi?: boolean;
  values?: Array<number | string>;
  onChangeMulti?: (vals: Array<number | string>, items?: SearchSelectItem[]) => void;

  disabled?: boolean;
  required?: boolean;

  maxMenuHeight?: number;
  className?: string;

  size?: "sm" | "md" | "lg";

  // optional custom render
  renderItem?: (item: SearchSelectItem, selected: boolean) => React.ReactNode;
};

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <span className="font-semibold text-slate-900">{match}</span>
      {after}
    </>
  );
}

export default function SearchSelect({
  label,
  helperText,
  placeholder = "Search...",
  items,

  value = null,
  onChange,

  multi = false,
  values = [],
  onChangeMulti,

  disabled = false,
  required = false,

  maxMenuHeight = 280,
  className,
  size = "md",
  renderItem,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const sizeCls = useMemo(() => {
    if (size === "sm") return "px-3 py-2 text-sm";
    if (size === "lg") return "px-4 py-3 text-base";
    return "px-3 py-2.5 text-sm";
  }, [size]);

  const selectedMap = useMemo(() => {
    const map = new Map<string, SearchSelectItem>();
    items.forEach((it) => map.set(String(it.id), it));
    return map;
  }, [items]);

  const selectedSingle = value != null ? selectedMap.get(String(value)) : undefined;

  const selectedMultiItems = useMemo(() => {
    return (values ?? [])
      .map((v) => selectedMap.get(String(v)))
      .filter(Boolean) as SearchSelectItem[];
  }, [values, selectedMap]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) => {
      const a = it.label.toLowerCase();
      const b = (it.subLabel || "").toLowerCase();
      return a.includes(qq) || b.includes(qq);
    });
  }, [items, q]);

  useEffect(() => {
    setActiveIndex(0);
  }, [q, open]);

  const isSelected = (id: number | string) => {
    if (multi) return (values ?? []).some((v) => String(v) === String(id));
    return String(value ?? "") === String(id);
  };

  const close = () => {
    setOpen(false);
    setQ("");
  };

  const pick = (item: SearchSelectItem) => {
    if (disabled) return;

    if (!multi) {
      onChange?.(item.id, item);
      // keep search input available even after selecting (you asked this)
      setOpen(false);
      setQ("");
      return;
    }

    const exists = (values ?? []).some((v) => String(v) === String(item.id));
    const next = exists
      ? (values ?? []).filter((v) => String(v) !== String(item.id))
      : [...(values ?? []), item.id];

    onChangeMulti?.(
      next,
      next.map((v) => selectedMap.get(String(v))).filter(Boolean) as SearchSelectItem[],
    );

    // keep open for multi select
    setQ("");
    inputRef.current?.focus();
  };

  const clearSingle = () => {
    if (disabled) return;
    onChange?.(null);
    setQ("");
    inputRef.current?.focus();
  };

  const removeChip = (id: number | string) => {
    if (disabled) return;
    if (!multi) return clearSingle();

    const next = (values ?? []).filter((v) => String(v) !== String(id));
    onChangeMulti?.(
      next,
      next.map((v) => selectedMap.get(String(v))).filter(Boolean) as SearchSelectItem[],
    );
  };

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => Math.min(p + 1, filtered.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => Math.max(p - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) pick(item);
    }
  };

  return (
    <div ref={wrapRef} className={clsx("w-full", className)}>
      {label ? (
        <div className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
          <span>{label}</span>
          {required ? <span className="text-red-500">*</span> : null}
        </div>
      ) : null}

      {/* Control */}
      <div
        className={clsx(
          "rounded-xl border bg-white shadow-sm transition",
          open ? "border-primary ring-4 ring-primary/10" : "border-slate-200",
          disabled ? "bg-slate-100 opacity-70 cursor-not-allowed" : "cursor-text",
        )}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className={clsx("flex items-center gap-2", sizeCls)}>
          {/* left icon */}
          <div className="text-slate-400">
            <Search />
          </div>

          {/* input always visible (single + multi) */}
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => !disabled && setOpen(true)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Disabled"
                : multi
                  ? selectedMultiItems.length
                    ? "Search to add more..."
                    : placeholder
                  : selectedSingle
                    ? "Search to change..."
                    : placeholder
            }
            className="w-full bg-transparent !outline-none border-0 text-sm focus:border-0 focus:!ring-0 "
          />

          {/* right actions */}
          <div className="flex items-center gap-2">
            {/* clear */}
            {!multi && selectedSingle ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSingle();
                }}
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                Clear
              </button>
            ) : null}

            {/* chevron */}
            <div className={clsx("text-slate-400 transition", open ? "rotate-180" : "")}>
              ▾
            </div>
          </div>
        </div>

        {/* Selected display row */}
        {!multi && selectedSingle ? (
          <div className="border-t border-slate-100 px-3 py-2 text-sm text-slate-700 flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-900">{selectedSingle.label}</span>
              {selectedSingle.subLabel ? (
                <span className="ml-2 text-xs text-slate-500">{selectedSingle.subLabel}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Chips for multi */}
        {multi && selectedMultiItems.length > 0 ? (
          <div className="border-t border-slate-100 px-3 py-2 flex flex-wrap gap-2">
            {selectedMultiItems.map((it) => (
              <span
                key={String(it.id)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                {it.label}
                <button
                  type="button"
                  className="ml-1 rounded-full px-1 text-slate-500 hover:text-slate-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(it.id);
                  }}
                  aria-label={`Remove ${it.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {helperText ? <div className="mt-1 text-xs text-slate-500">{helperText}</div> : null}

      {/* Menu */}
      {open && !disabled ? (
        <div
          className="mt-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-auto"
          style={{ maxHeight: maxMenuHeight }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              No results found.
              <div className="text-xs text-slate-400 mt-1">Try searching by name or code.</div>
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((it, idx) => {
                const sel = isSelected(it.id);
                const active = idx === activeIndex;

                return (
                  <button
                    key={String(it.id)}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => pick(it)}
                    className={clsx(
                      "w-full text-left px-3 py-2 rounded-lg flex items-start justify-between gap-3 transition",
                      active ? "bg-slate-100" : "hover:bg-slate-50",
                      sel ? "bg-primary/10" : "",
                    )}
                  >
                    <div>
                      {renderItem ? (
                        renderItem(it, sel)
                      ) : (
                        <>
                          <div className="text-sm text-slate-800">
                            {highlight(it.label, q)}
                          </div>
                          {it.subLabel ? (
                            <div className="text-xs text-slate-500">{highlight(it.subLabel, q)}</div>
                          ) : null}
                        </>
                      )}
                    </div>

                    {sel ? (
                      <span className="text-xs font-semibold text-primary mt-1"><Check /></span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
