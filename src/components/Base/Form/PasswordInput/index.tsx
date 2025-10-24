"use client";

import { useState, forwardRef } from "react";
import FormInput from "@/components/Base/Form/FormInput";
import Lucide from "@/components/Base/Lucide";

type Props = React.ComponentPropsWithoutRef<"input"> & {
  formInputSize?: "sm" | "lg";
  rounded?: boolean;
};

const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        {/* Reuse your FormInput; just add padding-right for the icon area */}
        <FormInput
          ref={ref}
          type={show ? "text" : "password"}
          className={`pr-10 ${className || ""}`}
          {...props}
        />

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          tabIndex={-1}
        >
          <Lucide icon={show ? "EyeOff" : "Eye"} className="w-5 h-5" />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
