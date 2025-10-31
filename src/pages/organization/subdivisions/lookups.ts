// lookups.ts
import { api } from "@/lib/axios";

export async function getRelatedByCircle(circle_id: number) {
  const { data } = await api.get(`/api/v1/meta/related`, {
    params: { circle_id },
  });
  return data;
}
