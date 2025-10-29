// Types + API helpers
import { api } from "@/lib/axios";

export interface Division {
  id: number;
  circle_id: number;
  code: string;
  name: string;
  divphno?: string | null;
  divmob?: string | null;
  circode?: string | null;
  divcompphno?: string | null;
  description?: string | null;
  is_active: boolean | number;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DivisionResponse {
  data: Division[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// GET divisions (paginated + search)
export async function getDivisions(params: { page: number; perPage: number; search: string }) {
  const { page, perPage, search } = params;
  const { data } = await api.get<DivisionResponse>("/api/v1/meta/divisions", {
    params: { page, per_page: perPage, search },
  });
  return data;
}

// POST create
export async function createDivision(payload: {
  circle_id: number;
  code: string;
  name: string;
  divphno?: string;
  divmob?: string;
  divcompphno?: string;
  description?: string;
}) {
  const { data } = await api.post(`/api/v1/meta/divisions`, payload);
  return data;
}

// PATCH update
export async function updateDivision(
  id: number,
  payload: {
    circle_id: number;
    code: string;
    name: string;
    divphno?: string;
    divmob?: string;
    divcompphno?: string;
    description?: string;
  }
) {
  const { data } = await api.patch(`/api/v1/meta/divisions/${id}`, payload);
  return data;
}

// POST toggle (assumes same pattern as regions/circles)
export async function toggleDivision(id: number, is_active: boolean) {
  const { data } = await api.post(`/api/v1/meta/divisions/${id}/toggle`, { is_active });
  return data;
}

// DELETE
export async function deleteDivision(id: number) {
  const { data } = await api.delete(`/api/v1/meta/divisions/${id}`);
  return data;
}

// For dropdown: circles minimal list (id + name). Adjust if you have a proper options endpoint.
export async function getCircleOptions() {
  const { data } = await api.get<{ data: { id: number; name: string }[] }>(
    "/api/v1/meta/circles",
    { params: { per_page: 1000, search: "" } }
  );
  // Map to minimal shape
  return (data?.data ?? []).map((c) => ({ id: c.id, name: c.name }));
}
