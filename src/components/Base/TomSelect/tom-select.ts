import { TomSelectProps, TomSelectElement } from "./index";
import TomSelect, { TomSelectOptions } from "tom-select";
import _ from "lodash";

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

const setValue = <T extends string | string[]>(
  el: TomSelectElement,
  props: TomSelectProps<T>
) => {
  if (props.value.length) {
    if (Array.isArray(props.value)) {
      for (const value of props.value) {
        const selectedOption = Array.from(el).find(
          (option) =>
            option instanceof HTMLOptionElement && option.value == value
        );

        if (
          selectedOption !== undefined &&
          selectedOption instanceof HTMLOptionElement
        ) {
          selectedOption.selected = true;
        }
      }
    } else {
      el.value = props.value;
    }
  }
};

const init = <T extends string | string[]>(
  originalEl: TomSelectElement,
  clonedEl: TomSelectElement,
  props: TomSelectProps<T>,
  computedOptions: RecursivePartial<TomSelectOptions>
) => {
  // On option add
  if (Array.isArray(props.value)) {
    computedOptions = {
      onOptionAdd: function (value: string | number) {
        // Add new option in the original <select>
        const newOption = document.createElement("option");
        newOption.value = value.toString();
        newOption.text = value.toString();
        originalEl.add(newOption);

        // Emit option add
        props.onOptionAdd && props.onOptionAdd(value.toString());
      },
      ...computedOptions,
    };
  }

  clonedEl.TomSelect = new TomSelect(clonedEl, computedOptions);

  // On change
  clonedEl.TomSelect.on("change", function (selected: string[] | string) {
    if (props.onChange) {
      props.onChange({
        target: {
          value: Array.isArray(selected)
            ? ([...selected] as T)
            : (selected as T),
        },
      });
    }
  });
};

const getOptions = (
  options: HTMLCollection | undefined,
  tempOptions: Element[] = []
) => {
  if (options) {
    Array.from(options).forEach(function (optionEl) {
      if (optionEl instanceof HTMLOptGroupElement) {
        getOptions(optionEl.children, tempOptions);
      } else {
        tempOptions.push(optionEl);
      }
    });
  }
  return tempOptions;
};

const updateValue = <T extends string | string[]>(
  originalEl: TomSelectElement,
  clonedEl: TomSelectElement,
  value: string | string[],
  props: TomSelectProps<T>,
  computedOptions: RecursivePartial<TomSelectOptions>
) => {
  // Remove old options
  const existing = clonedEl.TomSelect.options as Record<
    string,
    { value: string | number; text?: string }
  >;

  for (const [, option] of Object.entries(existing)) {
    const stillExists = getOptions(originalEl.children).some((optionEl) => {
      return (
        optionEl instanceof HTMLOptionElement &&
        optionEl.value === String(option.value)
      );
    });

    if (!stillExists) {
      clonedEl.TomSelect.removeOption(option.value);
    }
  }

  // Update classnames
  const initialClassNames = clonedEl
    .getAttribute("data-initial-class")
    ?.split(" ");
  clonedEl.setAttribute(
    "class",
    [
      ...Array.from(originalEl.classList),
      ...Array.from(clonedEl.classList).filter(
        (className) => initialClassNames?.indexOf(className) == -1
      ),
    ].join(" ")
  );

  clonedEl.TomSelect.wrapper.setAttribute(
    "class",
    [
      ...Array.from(originalEl.classList),
      ...Array.from(clonedEl.TomSelect.wrapper.classList).filter(
        (className) => initialClassNames?.indexOf(className) == -1
      ),
    ].join(" ")
  );

  clonedEl.setAttribute(
    "data-initial-class",
    Array.from(originalEl.classList).join(" ")
  );

  // Add new options
  const options = originalEl.children;
  if (options) {
    Array.from(options).forEach(function (optionEl) {
      const valueAttr = optionEl.getAttribute("value");
      clonedEl.TomSelect.addOption({
        text: optionEl.textContent ?? undefined,
        value: valueAttr ?? "",
      });
    });
  }

  // Refresh options
  clonedEl.TomSelect.refreshOptions(false);

  // Update value if changed
  const current = clonedEl.TomSelect.getValue();
  const changed =
    (!Array.isArray(value) && value !== current) ||
    (Array.isArray(value) && !_.isEqual(value, current));

  if (changed) {
    clonedEl.TomSelect.destroy();
    if (originalEl.innerHTML) {
      clonedEl.innerHTML = originalEl.innerHTML;
    }
    setValue(clonedEl, props);
    init(originalEl, clonedEl, props, computedOptions);
  }
};

export { setValue, init, updateValue };
