// src/pages/meta/grid-stations/gridStations.ts
"use client";

import { api } from "@/lib/axios";

export interface GridStation {
  id: number;
  sub_division_id: number;
  sub_division_name: string;
  sub_division_code: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface GridStationResponse {
  data: GridStation[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number | string;
}

/* CRUD functions */
export async function getGridStations(params: {
  page: number;
  perPage: number;
  search: string;
}) {
  const { data } = await api.get<GridStationResponse>(
    "/api/v1/meta/grid-stations",
    { params }
  );
  return data;
}

export async function createGridStation(payload: Partial<GridStation>) {
  return api.post("/api/v1/meta/grid-stations", payload);
}

export async function updateGridStation(id: number, payload: Partial<GridStation>) {
  return api.patch(`/api/v1/meta/grid-stations/${id}`, payload);
}

export async function toggleGridStation(id: number, is_active: boolean) {
  return api.post(`/api/v1/meta/grid-stations/${id}/toggle`, { is_active });
}

export async function deleteGridStation(id: number) {
  return api.delete(`/api/v1/meta/grid-stations/${id}`);
}
