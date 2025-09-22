declare module "tom-select" {
  export interface TomSelectOptions {
    create?: boolean | ((input: string) => any);
    maxItems?: number;
    valueField?: string;
    labelField?: string;
    searchField?: string | string[];
    options?: any[];
    items?: any[];
    plugins?: string[] | Record<string, any>;
  }
  export default class TomSelect {
    constructor(select: string | HTMLElement, options?: TomSelectOptions);
    destroy(): void;
    clear(silent?: boolean): void;
    addItem(value: string | number, silent?: boolean): void;
  }
}
declare module "tom-select/dist/esm/tom-select.complete.js" {
  import TomSelect from "tom-select";
  export default TomSelect;
}
