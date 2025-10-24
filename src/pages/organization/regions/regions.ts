// src/services/regions.ts
import { api } from "@/lib/axios";

export interface Region {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegionResponse {
  data: Region[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function getRegions(params: { page: number; perPage: number; search: string }) {
  const { page, perPage, search } = params;
  const { data } = await api.get<RegionResponse>(
    `/api/v1/meta/regions?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`
  );
  return data;
}

export async function createRegion(payload: { code: string; name: string; description?: string }) {
  const { data } = await api.post(`/api/v1/meta/regions`, payload);
  return data;
}

export async function updateRegion(id: number, payload: { code: string; name: string; description?: string }) {
  const { data } = await api.patch(`/api/v1/meta/regions/${id}`, payload);
  return data;
}

export async function toggleRegion(id: number, is_active: boolean) {
  // Backend shows "POST Toggle Region" — sending desired state
  const { data } = await api.post(`/api/v1/meta/regions/${id}`, { is_active });
  return data;
}

export async function deleteRegion(id: number) {
  const { data } = await api.delete(`/api/v1/meta/regions/${id}`);
  return data;
}
