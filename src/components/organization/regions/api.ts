import type { Region, Status, ID } from "../types";

let REGIONS_DB: Region[] = [
  {
    id: crypto.randomUUID(),
    name: "Multan Region",
    code: "MLT",
    status: "active",
    notes: "Pilot region",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Bahawalpur Region",
    code: "BWP",
    status: "inactive",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

type ListParams = {
  q?: string;
  status?: "all" | Status;
  page?: number;
  size?: number;
};

const sleep = (ms = 250) => new Promise(res => setTimeout(res, ms));

export const regionsApi = {
  async list(params: ListParams = {}) {
    await sleep();
    const { q = "", status = "all", page = 1, size = 10 } = params;

    let rows = [...REGIONS_DB];
    if (q.trim()) {
      const qq = q.toLowerCase();
      rows = rows.filter(
        r =>
          r.name.toLowerCase().includes(qq) ||
          (r.code ?? "").toLowerCase().includes(qq)
      );
    }
    if (status !== "all") rows = rows.filter(r => r.status === status);

    const total = rows.length;
    const start = (page - 1) * size;
    const data = rows.slice(start, start + size);

    return { data, total, page, size };
  },

  async get(id: ID) {
    await sleep();
    const found = REGIONS_DB.find(r => r.id === id);
    if (!found) throw new Error("Region not found");
    return found;
  },

  async create(payload: Omit<Region, "id" | "createdAt" | "updatedAt">) {
    await sleep();
    const now = new Date().toISOString();
    const row: Region = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...payload };
    REGIONS_DB = [row, ...REGIONS_DB];
    return row;
  },

  async update(id: ID, patch: Partial<Omit<Region, "id" | "createdAt">>) {
    await sleep();
    REGIONS_DB = REGIONS_DB.map(r =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
    );
    return REGIONS_DB.find(r => r.id === id)!;
  },

  async remove(id: ID) {
    await sleep();
    REGIONS_DB = REGIONS_DB.filter(r => r.id !== id);
    return true;
  },

  async toggleStatus(id: ID) {
    await sleep();
    REGIONS_DB = REGIONS_DB.map(r =>
      r.id === id
        ? {
            ...r,
            status: r.status === "active" ? "inactive" : "active",
            updatedAt: new Date().toISOString(),
          }
        : r
    );
    return REGIONS_DB.find(r => r.id === id)!;
  },
};
