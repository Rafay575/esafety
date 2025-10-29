"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { GenericTable } from "@/components/Base/GenericTable";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { RegionFormDialog, RegionViewDialog, RegionDeleteDialog } from "./RegionDialogs";
import { FormSwitch } from "@/components/Base/Form";

// --- Types ---
interface Region {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean | number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RegionResponse {
  data: Region[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// --- Page Component ---
export default function RegionsListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // --- Fetch Regions ---
// --- Fetch Regions ---
const { data, isFetching, isError, refetch } = useQuery({
  queryKey: ["regions", page, perPage, search],
  queryFn: async () => {
    const { data } = await api.get<RegionResponse>(`/api/v1/meta/regions`, {
      params: { page, per_page: perPage, search },
    });
    return data;
  },
});

const regions = data?.data ?? [];
const total = data?.total ?? 0;
3
// --- Mutations ---
const createRegion = useMutation({
  mutationFn: async (payload: { code: string; name: string; description?: string }) => {
    toast.loading("Creating region…");
    const { data } = await api.post(`/api/v1/meta/regions`, payload);
    return data;
  },
  onSuccess: () => {
    toast.dismiss();
    toast.success("Region created successfully");
    setFormOpen(false);
    qc.invalidateQueries({ queryKey: ["regions"] });
  },
  onError: (err: any) => {
    toast.dismiss();
    toast.error(err?.response?.data?.message || "Failed to create region");
  },
});

const updateRegion = useMutation({
  mutationFn: async ({
    id,
    payload,
  }: {
    id: number;
    payload: { code: string; name: string; description?: string };
  }) => {
    toast.loading("Updating region…");
    const { data } = await api.patch(`/api/v1/meta/regions/${id}`, payload);
    return data;
  },
  onSuccess: () => {
    toast.dismiss();
    toast.success("Region updated successfully");
    setFormOpen(false);
    qc.invalidateQueries({ queryKey: ["regions"] });
  },
  onError: (err: any) => {
    toast.dismiss();
    toast.error(err?.response?.data?.message || "Failed to update region");
  },
});

const toggleRegion = useMutation({
  mutationFn: async ({
    id,
    is_active,
  }: {
    id: number;
    is_active: boolean;
  }) => {
    toast.loading("Updating status…");
    const { data } = await api.post(`/api/v1/meta/regions/${id}/toggle`, {
      is_active,
    });
    return data;
  },
  onSuccess: () => {
    toast.dismiss();
    toast.success("Status updated successfully");
    qc.invalidateQueries({ queryKey: ["regions"] });
  },
  onError: () => {
    toast.dismiss();
    toast.error("Failed to toggle status");
  },
});

const deleteRegion = useMutation({
  mutationFn: async (id: number) => {
    toast.loading("Deleting region…");
    const { data } = await api.delete(`/api/v1/meta/regions/${id}`);
    return data;
  },
  onSuccess: () => {
    toast.dismiss();
    toast.success("Region deleted successfully");
    setDeleteOpen(false);
    qc.invalidateQueries({ queryKey: ["regions"] });
  },
  onError: () => {
    toast.dismiss();
    toast.error("Failed to delete region");
  },
});


  // --- Columns ---
 const columns = [
  { key: "name", label: "Region Name" },
  { key: "code", label: "Code" },
  {
    key: "is_active",
    label: "Status",
    render: (r: Region) => (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
        <FormSwitch>
          <FormSwitch.Input
            type="checkbox"
            checked={!!r.is_active}
            onChange={(e) =>
              toggleRegion.mutate({ id: r.id, is_active: e.target.checked })
            }
          />
        </FormSwitch>
      </div>
    ),
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "Updated",
    render: (r: Region) =>
      new Date(r.updated_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
  },
];


  // --- Actions ---
  const actions = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (r: Region) => {
        setSelectedRegion(r);
        setViewOpen(true);
      },
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r: Region) => {
        setSelectedRegion(r);
        setFormMode("edit");
        setFormOpen(true);
      },
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: 'danger' as const ,
      onClick: (r: Region) => {
        setSelectedRegion(r);
        setDeleteOpen(true);
      },
    },
  ];

  // --- JSX ---
  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Regions"
        data={regions}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load regions" : null}
        onRetry={refetch}
        page={page}
        perPage={perPage}
        total={total}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        toolbarActions={
          <Button
            variant="primary"
            onClick={() => {
              setSelectedRegion(null);
              setFormMode("create");
              setFormOpen(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Add Region
          </Button>
        }
      />

      {/* Dialogs */}
      <RegionViewDialog open={viewOpen} region={selectedRegion} onClose={() => setViewOpen(false)} />

      <RegionFormDialog
        open={formOpen}
        mode={formMode}
        initial={formMode === "edit" ? selectedRegion ?? undefined : undefined}
        loading={createRegion.isPending || updateRegion.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => {
          if (formMode === "create") createRegion.mutate(values);
          else if (selectedRegion?.id) updateRegion.mutate({ id: selectedRegion.id, payload: values });
        }}
      />

      <RegionDeleteDialog
        open={deleteOpen}
        region={selectedRegion}
        loading={deleteRegion.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedRegion?.id && deleteRegion.mutate(selectedRegion.id)}
      />
    </div>
  );
}


//  