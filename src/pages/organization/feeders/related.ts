import { api } from "@/lib/axios";

export async function getRelatedBySubDivision(sub_division_id: number) {
  const { data } = await api.get(`/api/v1/meta/related`, {
    params: { sub_division_id },
  });
  return data;
}
