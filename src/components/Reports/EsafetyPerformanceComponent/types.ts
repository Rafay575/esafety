// src/features/esafetyReport/types.ts

// Add these to your existing types
export interface ESafetyReportCountParams {
  circle_id?: string;
  division_id?: string;
  sub_division_id?: string;
  region_id?: string; // Added
  status?: string;
  from_date: string;
  to_date: string;
}

export interface HierarchyItem {
  id: number;
  name: string;
  code?: string;
}



export type ESafetyReportCountResponse = {
  success: boolean;
  data: ESafetyReportCountData;
};

export interface Status {
  id: number;
  code: string;
  label_en: string;
  short_label_en: string;
  label_ur: string;
  short_label_ur: string;
  sort_order: number;
}

export interface StatusesResponse {
  success: boolean;
  data: Status[];
}
export interface HierarchyItem {
  id: number;
  name: string;
  code?: string;
}

export interface HierarchyResponse {
  data?: {
    lists?: {
      circles?: HierarchyItem[];
      divisions?: HierarchyItem[];
      sub_divisions?: HierarchyItem[];
    };
  };
  rows?: HierarchyItem[];
}

export interface HierarchyFilters {
  region_id?: number;
  circle_id?: number;
  division_id?: number;
  sub_division_id?: number;
}


// Updated types to match new API response
export interface BreakdownItem {
  id: number;
  code: string;
  name: string;
  total_ptw_count: number;
  statuses: StatusCount[];
}

export interface StatusCount {
  code: string;
  label_en: string;
  short_label_en: string;
  label_ur: string;
  short_label_ur: string;
  count: number;
}

export interface BreadcrumbUnit {
  id: number;
  code: string;
  name: string;
}

export interface ESafetyReportCountData {
  total_ptw_count: number;
  filters: {
    circle_id: string;
    division_id: string | null;
    sub_division_id: string | null;
    status: string | null;
    from_date: string;
    to_date: string;
  };
  breakdown: BreakdownItem[];
  breadcrumb: {
    circle?: BreadcrumbUnit;
    division?: BreadcrumbUnit;
    sub_division?: BreadcrumbUnit;
  };
  breakdown_type: 'status_only' | 'sub_divisions' | 'divisions' | 'circles';
}