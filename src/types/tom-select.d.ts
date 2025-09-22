// src/types/tom-select.d.ts

declare module "tom-select" {
  export type TomValue = string | number;

  export interface TomOption {
    value: TomValue;
    text?: string;
    [key: string]: any;
  }

  export interface TomSelectOptions {
    persist?: boolean;
    // allow the 1-arg function form most code uses, but don’t block extra args
    create?: boolean | ((input: string, ...args: any[]) => any);
    maxItems?: number;
    valueField?: string;
    labelField?: string;
    searchField?: string | string[];
    options?: TomOption[];
    items?: TomValue[];
    plugins?: string[] | Record<string, any>;
    onOptionAdd?: (value: TomValue, data?: TomOption) => void;
  }

  export default class TomSelect {
    constructor(select: string | HTMLElement, options?: Partial<TomSelectOptions>);

    // Event emitter surface
    on(event: string, handler: (...args: any[]) => void): void;

    // Commonly used instance API
    destroy(): void;
    clear(silent?: boolean): void;
    addItem(value: TomValue, silent?: boolean): void;
    addOption(option: TomOption): void;
    removeOption(value: TomValue): void;
    refreshOptions(triggerDropdown?: boolean): void;
    getValue(): string | string[];

    // Useful instance fields
    wrapper: HTMLElement;
    options: Record<string, TomOption>;
  }
}

declare module "tom-select/dist/esm/tom-select.complete.js" {
  import TomSelect from "tom-select";
  export default TomSelect;
}
