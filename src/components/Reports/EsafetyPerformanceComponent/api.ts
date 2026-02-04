// src/features/esafetyReport/api.ts
import axios from "axios";
import type { ESafetyReportCountParams } from "./types";

export const getESafetyReportCountApi = async (params: ESafetyReportCountParams) => {
  const res = await axios.get("/api/esafety-report/count", { params });
  return res.data;
};
