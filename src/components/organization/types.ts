export type ID = string;
export type Status = "active" | "inactive";

export interface Region {
  id: ID;
  name: string;
  code?: string;
  status: Status;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
