// src/features/esafetyReport/hooks.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchStatuses, getESafetyReportCountApi } from "./api";
import type { ESafetyReportCountParams, ESafetyReportCountResponse, StatusesResponse } from "./types";
import { 
  fetchRegions, 
  fetchCirclesByRegion, 
  fetchDivisionsByCircle, 
  fetchSubDivisionsByDivision 
} from "./hierarchy";
export const useESafetyReportCount = () =>
  useMutation<ESafetyReportCountResponse, any, ESafetyReportCountParams>({
    mutationFn: async (params) => {
      const t = toast.loading("Generating report...");
      try {
        const res = await getESafetyReportCountApi(params);

        // Basic validation
        if (!res?.success) {
          throw new Error(res?.message || "Report generation failed.");
        }

        toast.success("Report generated", { id: t });
        return res as ESafetyReportCountResponse;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to generate report.";
        toast.error(msg, { id: t });
        throw err;
      }
    },
  });


  export const useESafetyStatuses = () => {
  return useQuery<StatusesResponse>({
    queryKey: ['esafety-statuses'],
    queryFn: fetchStatuses,
  });
};




// Fetch all regions
export const useRegions = () => {
  return useQuery({
    queryKey: ["esafety-regions"],
    queryFn: async () => {
      try {
        const regions = await fetchRegions();
        return regions.map(region => ({
          value: region.id,
          label: region.code ? `${region.code} - ${region.name}` : region.name,
          ...region
        }));
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Failed to load regions";
        toast.error(errorMessage);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

// Fetch circles by region (enabled only when regionId is selected)
export const useCircles = (regionId: number | null) => {
  return useQuery({
    queryKey: ["esafety-circles", regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      try {
        const circles = await fetchCirclesByRegion(regionId);
        return circles.map(circle => ({
          value: circle.id,
          label: circle.code ? `${circle.code} - ${circle.name}` : circle.name,
          ...circle
        }));
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Failed to load circles";
        toast.error(errorMessage);
        return []; // Return empty array on error
      }
    },
    enabled: !!regionId, // Only run when regionId is provided
    staleTime: 10 * 60 * 1000,
  });
};

// Fetch divisions by circle (enabled only when circleId is selected)
export const useDivisions = (circleId: number | null) => {
  return useQuery({
    queryKey: ["esafety-divisions", circleId],
    queryFn: async () => {
      if (!circleId) return [];
      
      try {
        const divisions = await fetchDivisionsByCircle(circleId);
        return divisions.map(division => ({
          value: division.id,
          label: division.code ? `${division.code} - ${division.name}` : division.name,
          ...division
        }));
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Failed to load divisions";
        toast.error(errorMessage);
        return [];
      }
    },
    enabled: !!circleId,
    staleTime: 10 * 60 * 1000,
  });
};

// Fetch sub-divisions by division (enabled only when divisionId is selected)
export const useSubDivisions = (divisionId: number | null) => {
  return useQuery({
    queryKey: ["esafety-subdivisions", divisionId],
    queryFn: async () => {
      if (!divisionId) return [];
      
      try {
        const subDivisions = await fetchSubDivisionsByDivision(divisionId);
        return subDivisions.map(subDivision => ({
          value: subDivision.id,
          label: subDivision.code ? `${subDivision.code} - ${subDivision.name}` : subDivision.name,
          ...subDivision
        }));
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Failed to load sub-divisions";
        toast.error(errorMessage);
        return [];
      }
    },
    enabled: !!divisionId,
    staleTime: 10 * 60 * 1000,
  });
};