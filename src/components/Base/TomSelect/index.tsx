// src/components/Base/TomSelect/index.tsx
import "@/assets/css/vendors/tom-select.css";
import clsx from "clsx";
import React, { createRef, useEffect, useMemo, useRef } from "react";
import TomSelect from "tom-select"; // ✅ compiled bundle + shim types
import { setValue, init, updateValue } from "./tom-select";
import type { TomSelectOptions } from "tom-select";

// Local utility type (since we no longer import from tom-select/src)
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

// Instance type for the TomSelect class from our shim
type TomSelectInstance = InstanceType<typeof TomSelect>;

export interface TomSelectElement extends HTMLSelectElement {
  TomSelect: TomSelectInstance;
}

export interface TomSelectProps<T extends string | string[]>
  extends React.PropsWithChildren,
    Omit<React.ComponentPropsWithoutRef<"select">, "onChange" | "value"> {
  value: T;
  onOptionAdd?: (value: string) => void;
  onChange: (e: { target: { value: T } }) => void;
  options?: RecursivePartial<TomSelectOptions>;
  getRef?: (el: TomSelectElement) => void;
}

function TomSelectComponent<T extends string | string[]>({
  className = "",
  options = {},
  value,
  onOptionAdd = () => {},
  onChange = () => {},
  getRef = () => {},
  children,
  ...computedProps
}: TomSelectProps<T>) {
  const props = {
    className,
    options,
    value,
    onOptionAdd,
    onChange,
    getRef,
  };

  const initialRender = useRef(true);
  const tomSelectRef = createRef<TomSelectElement>();

  // Build TomSelect options (typed against our shim)
  const computedOptions = useMemo<RecursivePartial<TomSelectOptions>>(() => {
    let o: RecursivePartial<TomSelectOptions> = {
      ...props.options,
      plugins: {
        // record form is fine with our shim
        dropdown_input: {},
        ...(props.options?.plugins as Record<string, any>),
      },
    };

    if (Array.isArray(props.value)) {
      o = {
        persist: false,
        create: true,
        // optional callback used in your code; include in shim (see below)
        onDelete: function (values: string[]) {
          return confirm(
            values.length > 1
              ? `Are you sure you want to remove these ${values.length} items?`
              : `Are you sure you want to remove "${values[0]}"?`
          );
        },
        ...o,
        plugins: {
          remove_button: { title: "Remove this item" },
          ...(o.plugins as Record<string, any>),
        },
      };
    }

    return o;
  }, [props.options, props.value]);

  useEffect(() => {
    if (!tomSelectRef.current) return;

    props.getRef(tomSelectRef.current);

    if (initialRender.current) {
      // Unique attribute
      tomSelectRef.current.setAttribute(
        "data-id",
        "_" + Math.random().toString(36).substr(2, 9)
      );

      // Clone the <select> so Tom Select doesn't remove the original
      const clonedEl = tomSelectRef.current.cloneNode(true) as TomSelectElement;

      // Save initial classnames
      const classNames = tomSelectRef.current.getAttribute("class");
      if (classNames) clonedEl.setAttribute("data-initial-class", classNames);

      // Hide original & append clone next to it
      tomSelectRef.current.parentNode?.appendChild(clonedEl);
      tomSelectRef.current.setAttribute("hidden", "true");

      // Initialize
      setValue(clonedEl, props as any);
      init(tomSelectRef.current, clonedEl, props as any, computedOptions);

      initialRender.current = false;
    } else {
      const clonedEl = document.querySelectorAll(
        `[data-id='${tomSelectRef.current.getAttribute(
          "data-id"
        )}'][data-initial-class]`
      )[0] as TomSelectElement;

      updateValue(
        tomSelectRef.current,
        clonedEl,
        props.value as any,
        props as any,
        computedOptions
      );
    }
  }, [tomSelectRef, props.value, props.className, computedOptions]);

  return (
    <select
      {...computedProps}
      ref={tomSelectRef}
      value={props.value as any}
      onChange={(e) =>
        props.onChange({
          target: { value: (e.target.value as unknown) as T },
        })
      }
      className={clsx(["tom-select", props.className])}
    >
      {children}
    </select>
  );
}

export default TomSelectComponent;
