// src/services/circles.ts
import { api } from "@/lib/axios";

export interface Circle {
  id: number;
  region_id: number;
  code: string;
  name: string;
  cirphno?: string | null;
  cirmob?: string | null;
  circompphno?: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CircleResponse {
  data: Circle[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function getCircles(params: { page: number; perPage: number; search: string }) {
  const { page, perPage, search } = params;
  const { data } = await api.get<CircleResponse>(
    `/api/v1/meta/circles?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`
  );
  return data;
}

export async function createCircle(payload: {
  region_id: number;
  code: string;
  name: string;
  cirphno?: string | null;
  cirmob?: string | null;
  circompphno?: string | null;
}) {
  const { data } = await api.post(`/api/v1/meta/circles`, payload);
  return data;
}

export async function updateCircle(
  id: number,
  payload: {
    region_id: number;
    code: string;
    name: string;
    cirphno?: string | null;
    cirmob?: string | null;
    circompphno?: string | null;
  }
) {
  const { data } = await api.patch(`/api/v1/meta/circles/${id}`, payload);
  return data;
}

export async function toggleCircle(id: number, is_active: boolean) {
  // toggle route matches your regions pattern (/toggle)
  const { data } = await api.post(`/api/v1/meta/circles/${id}/toggle`, { is_active });
  return data;
}

export async function deleteCircle(id: number) {
  const { data } = await api.delete(`/api/v1/meta/circles/${id}`);
  return data;
}
