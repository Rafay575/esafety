import { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import Lucide from "@/components/Base/Lucide";
import FormInput from "@/components/Base/Form/FormInput";
import clsx from "clsx";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  formInputSize?: "sm" | "lg";
  rounded?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
};

const DateSelector = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      value,
      onChange,
      placeholder = "Select date",
      formInputSize,
      rounded,
      className,
      minDate,
      maxDate,
      showTimeSelect = false,
      dateFormat = showTimeSelect ? "Pp" : "P",
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
    };

    return (
      <div className="relative w-full">
        {label && (
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}

        <DatePicker
          selected={value}
          onChange={(date) => onChange?.(date)}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect}
          dateFormat={dateFormat}
          showMonthDropdown
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={80}
          wrapperClassName="w-full"
          popperClassName="z-50 w-full"
          calendarClassName="rounded-2xl shadow-lg border border-slate-200  text-slate-700 dark:text-slate-200"
          open={open}
          onClickOutside={() => setOpen(false)}
          onSelect={() => setOpen(false)}
          onFocus={() => setOpen(true)} // 👈 open on focus (click)
          customInput={
            <div
              className="relative w-full cursor-pointer select-none"
              onClick={(e) => {
                e.preventDefault();
                setOpen(true);
              }}
            >
              <FormInput
                ref={ref}
                readOnly
                value={value ? value.toLocaleDateString("en-CA") : ""}
                placeholder={placeholder}
                className={clsx(
                  "w-full pr-20 transition-all duration-200 focus:ring-2 focus:ring-primary/40 hover:border-primary/50 dark:focus:ring-slate-700",
                  className
                )}
                formInputSize={formInputSize}
                rounded={rounded}
              />

              {/* Calendar Icon */}
              <div className="absolute inset-y-0 right-8 flex items-center pr-3 text-slate-500 pointer-events-none">
                <Lucide icon="Calendar" className="w-5 h-5" />
              </div>

              {/* Clear Button */}
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Lucide icon="XCircle" className="w-4 h-4" />
                </button>
              )}
            </div>
          }
          popperPlacement="bottom-start"
        />
      </div>
    );
  }
);

DateSelector.displayName = "DateSelector";
export default DateSelector;
