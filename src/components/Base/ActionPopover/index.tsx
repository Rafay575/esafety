
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ActionPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export default function ActionPopover({ trigger, children }: ActionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Calculate accurate screen position
  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 180; // adjust to your dropdown width
    const gap = 8; // distance below button

    const top = rect.bottom + gap;
    const left = rect.right - dropdownWidth;
    setCoords({ top, left });
  };

  const handleToggle = () => {
    if (!open) calculatePosition();
    setOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleScroll = () => open && calculatePosition();
    const handleResize = () => open && calculatePosition();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={handleToggle} className="inline-block relative">
        {trigger}
      </div>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="dropdown"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className={clsx(
                  "fixed min-w-[11rem] p-1 rounded-md border border-slate-200 dark:border-slate-600",
                  "bg-white dark:bg-darkmode-700 shadow-lg z-[9999]"
                )}
                style={{
                  top: coords.top,
                  left: coords.left,
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
