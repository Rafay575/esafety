import {api} from "@/lib/axios";
import type { ESafetyReportCountParams, StatusesResponse } from "./types";

export const getESafetyReportCountApi = async (params: ESafetyReportCountParams) => {
  const res = await api.get("/api/esafety-report/count", { params });
  return res.data;
};


export const fetchStatuses = async (): Promise<StatusesResponse> => {
  const response = await api.get('/api/esafety-report/statuses');
  return response.data;
};

