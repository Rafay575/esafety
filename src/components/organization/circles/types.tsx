export type Status = "active" | "inactive";

export type Circle = {
  id: string | undefined; // Allow id to be undefined
  name: string;
  region_id: number;
  code: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
