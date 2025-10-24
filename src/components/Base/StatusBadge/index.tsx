import React from "react";
import clsx from "clsx";

interface StatusBadgeProps {
  active: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ active }) => {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={clsx(
          "h-2.5 w-2.5 rounded-full",
          active ? "bg-emerald-500" : "bg-rose-500"
        )}
      ></span>
      <span
        className={clsx(
          "font-medium text-xs",
        
        )}
      >
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
};
