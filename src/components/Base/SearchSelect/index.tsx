"use client";
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Lucide from "@/components/Base/Lucide";
import { twMerge } from "tailwind-merge";
import { Loader } from "lucide-react";

type Option = { value: string | number; label: string };

interface SearchSelectProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Searchable dropdown select (shadcn-like) — forwardRef compatible
 */
const SearchSelect = forwardRef<HTMLDivElement, SearchSelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = "Select...",
      disabled = false,
      loading = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // Expose DOM node via ref (for Controller compatibility)
    useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement);

    const selectedLabel =
      options.find((opt) => String(opt.value) === String(value))?.label ?? "";

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on ESC key
    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    return (
      <div ref={wrapperRef} className={twMerge("relative", className)}>
        {/* Input Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={twMerge(
            "w-full text-left flex justify-between items-center border rounded-md px-3 py-2 text-sm transition bg-white shadow-sm",
            disabled
              ? "bg-slate-100 cursor-not-allowed"
              : "hover:border-primary/50 focus:ring focus:ring-primary/20"
          )}
        >
          <span className={selectedLabel ? "text-slate-800" : "text-slate-400"}>
            {selectedLabel || placeholder}
          </span>
          <Lucide
            icon="ChevronDown"
            className={twMerge(
              "w-4 h-4 text-slate-500 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
            {/* Search Bar */}
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:ring focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* Options */}
            <ul className="max-h-52 overflow-y-auto">
              {loading ? (
                <li className="px-3 py-2 text-sm text-slate-400 text-center flex justify-center">
                  <Loader className="animate-spin w-4 h-4 text-slate-400" />
                </li>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => (
                  <li
                    key={`${opt.value}-${idx}`} // ✅ prevents duplicate key warnings
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={twMerge(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 hover:text-primary",
                      String(opt.value) === String(value)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-slate-700"
                    )}
                  >
                    {opt.label}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-slate-400 text-center">
                  No results found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

SearchSelect.displayName = "SearchSelect";
export default SearchSelect;
