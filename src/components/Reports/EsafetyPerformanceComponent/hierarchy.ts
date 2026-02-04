import { api } from "@/lib/axios";
import type { HierarchyResponse, HierarchyItem } from "./types";

// Fetch regions
export const fetchRegions = async (): Promise<HierarchyItem[]> => {
  const res = await api.get("/api/v1/meta/regions", { 
    params: { per_page: "all" } 
  });
  return res.data?.data ?? res.data?.rows ?? [];
};

// Fetch related data (circles, divisions, sub-divisions)
export const fetchRelated = async (params: {
  region_id?: number;
  circle_id?: number;
  division_id?: number;
}): Promise<{
  circles: HierarchyItem[];
  divisions: HierarchyItem[];
  sub_divisions: HierarchyItem[];
}> => {
  const res = await api.get("/api/v1/meta/related", { params });
  
  // Handle different response structures
  const lists = res.data?.lists || {};
  
  return {
    circles: lists.circles || [],
    divisions: lists.divisions || [],
    sub_divisions: lists.sub_divisions || [],
  };
};

// Fetch circles by region
export const fetchCirclesByRegion = async (regionId: number): Promise<HierarchyItem[]> => {
  const data = await fetchRelated({ region_id: regionId });
  return data.circles;
};

// Fetch divisions by circle
export const fetchDivisionsByCircle = async (circleId: number): Promise<HierarchyItem[]> => {
  const data = await fetchRelated({ circle_id: circleId });
  return data.divisions;
};

// Fetch sub-divisions by division
export const fetchSubDivisionsByDivision = async (divisionId: number): Promise<HierarchyItem[]> => {
  const data = await fetchRelated({ division_id: divisionId });
  return data.sub_divisions;
};