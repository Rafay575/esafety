import { api } from "@/lib/axios";

export interface SubDivision {
  id: number;
  division_id: number;
  circle_id: number;
  code: string;
  name: string;
  sdivphno?: string | null;
  sdivmob?: string | null;
  sdivcompphno?: string | null;
  description?: string | null;
  is_active: boolean | number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubDivisionResponse {
  data: SubDivision[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function getSubDivisions(params: { page: number; perPage: number; search: string }) {
  const { page, perPage, search } = params;
  const { data } = await api.get<SubDivisionResponse>(
    `/api/v1/meta/sub-divisions?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`
  );
  return data;
}

export async function createSubDivision(payload: {
  division_id: number;
  circle_id: number;
  code: string;
  name: string;
  sdivphno?: string;
  sdivmob?: string;
  sdivcompphno?: string;
  description?: string;
}) {
  const { data } = await api.post(`/api/v1/meta/sub-divisions`, payload);
  return data;
}

export async function updateSubDivision(
  id: number,
  payload: Partial<Omit<SubDivision, "id" | "created_at" | "updated_at">>
) {
  const { data } = await api.patch(`/api/v1/meta/sub-divisions/${id}`, payload);
  return data;
}

export async function toggleSubDivision(id: number, is_active: boolean) {
  const { data } = await api.post(`/api/v1/meta/sub-divisions/${id}/toggle`, { is_active });
  return data;
}

export async function deleteSubDivision(id: number) {
  const { data } = await api.delete(`/api/v1/meta/sub-divisions/${id}`);
  return data;
}
