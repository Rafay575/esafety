// src/features/esafetyReport/hooks.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getESafetyReportCountApi } from "./api";
import type { ESafetyReportCountParams, ESafetyReportCountResponse } from "./types";

const extractCount = (data: ESafetyReportCountResponse) => {
  if (typeof data === "number") return data;

  const c =
    data?.count ??
    data?.total ??
    data?.data?.count ??
    data?.data?.total;

  if (c === undefined || c === null) {
    throw new Error("Count not found in API response.");
  }

  return c;
};

export const useESafetyReportCount = () =>
  useMutation<number, any, ESafetyReportCountParams>({
    mutationFn: async (params) => {
      const t = toast.loading("Generating report...");
      try {
        const res = await getESafetyReportCountApi(params);
        const count = extractCount(res);
        toast.success("Report generated", { id: t });
        return count;
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
