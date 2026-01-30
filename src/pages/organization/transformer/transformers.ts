import { api } from "@/lib/axios";

export interface Transformer {
  id: number;
  sub_division_id: number;
  feeder_id: number;
  transformer_id: string;
  transformer_id_by_disco?: string | null;
  location_id?: string | null;
  feeder_code?: string | null;
  transformer_ref_no?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TransformerResponse {
  data: Transformer[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// --- API Calls ---
export async function getTransformers(params: { page: number; perPage: number; search: string }) {
  const { page, perPage, search } = params;
  const { data } = await api.get<TransformerResponse>("/api/v1/meta/transformers", {
    params: { page, per_page: perPage, search },
  });
  return data;
}

export async function createTransformer(payload: Partial<Transformer>) {
  const { data } = await api.post("/api/v1/meta/transformers", payload);
  return data;
}

export async function updateTransformer(id: number, payload: Partial<Transformer>) {
  const { data } = await api.patch(`/api/v1/meta/transformers/${id}`, payload);
  return data;
}

export async function toggleTransformer(id: number, is_active: boolean) {
  const { data } = await api.post(`/api/v1/meta/transformers/${id}/toggle`, { is_active });
  return data;
}

export async function deleteTransformer(id: number) {
  const { data } = await api.delete(`/api/v1/meta/transformers/${id}`);
  return data;
}
