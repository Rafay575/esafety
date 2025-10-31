import { api } from "@/lib/axios";

export interface Feeder {
  id: number;
  sub_division_id: number;
  grid_station_id?: number | null;
  code: string;
  name: string;
  description?: string | null;
  voltage_level?: string | null;
  lat?: string | null;
  lng?: string | null;
  is_active: boolean | number;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeederResponse {
  data: Feeder[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// --- API CALLS ---
export async function getFeeders(params: { page: number; perPage: number; search: string }) {
  const { page, perPage, search } = params;
  const { data } = await api.get<FeederResponse>(`/api/v1/meta/feeders`, {
    params: { page, per_page: perPage, search },
  });
  return data;
}

export async function createFeeder(payload: Partial<Feeder>) {
  const { data } = await api.post(`/api/v1/meta/feeders`, payload);
  return data;
}

export async function updateFeeder(id: number, payload: Partial<Feeder>) {
  const { data } = await api.patch(`/api/v1/meta/feeders/${id}`, payload);
  return data;
}

export async function toggleFeeder(id: number, is_active: boolean) {
  const { data } = await api.post(`/api/v1/meta/feeders/${id}/toggle`, { is_active });
  return data;
}

export async function deleteFeeder(id: number) {
  const { data } = await api.delete(`/api/v1/meta/feeders/${id}`);
  return data;
}
