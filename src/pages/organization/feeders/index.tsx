"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { GenericTable } from "@/components/Base/GenericTable";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormSwitch } from "@/components/Base/Form";
import {
  FeederFormDialog,
  FeederViewDialog,
  FeederDeleteDialog,
} from "./FeederDialogs";
import {
  getFeeders,
  createFeeder,
  updateFeeder,
  toggleFeeder,
  deleteFeeder,
  type Feeder,
  type FeederResponse,
} from "./feeders";
import { sanitizePayload } from "@/lib/utils";

export default function FeederListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["feeders", page, perPage, search],
    queryFn: () => getFeeders({ page, perPage, search }),
  });

  const feeders = data?.data ?? [];
  const total = data?.total ?? 0;
// --- Fetch Sub-Divisions ---
const { data: subDivData, isFetching: subDivLoading } = useQuery({
  queryKey: ["sub-divisions"],
  queryFn: async () => {
    const { data } = await api.get("/api/v1/meta/sub-divisions", {
      params: { per_page: "all", search: "" },
    });
    return data.data || [];
  },
});

  const createMut = useMutation({
    mutationFn: async (payload: Partial<Feeder>) => {
      toast.loading("Creating feeder…");
      const res = await createFeeder(sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Feeder created");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["feeders"] });
    },
    onError: () => toast.error("Failed to create feeder"),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Feeder> }) => {
      toast.loading("Updating feeder…");
      const res = await updateFeeder(id, sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Feeder updated");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["feeders"] });
    },
    onError: () => toast.error("Failed to update feeder"),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleFeeder(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feeders"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to toggle status"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteFeeder(id),
    onSuccess: () => {
      toast.success("Feeder deleted");
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ["feeders"] });
    },
    onError: () => toast.error("Failed to delete feeder"),
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    { key: "voltage_level", label: "Voltage" },
    {
      key: "is_active",
      label: "Status",
      render: (r: Feeder) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
          <FormSwitch>
            <FormSwitch.Input
              type="checkbox"
              checked={!!r.is_active}
              onChange={(e) => toggleMut.mutate({ id: r.id, is_active: e.target.checked })}
            />
          </FormSwitch>
        </div>
      ),
      className: "text-center",
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (r: Feeder) =>
        new Date(r.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    },
  ];

  const actions = [
    { label: "View", icon: "Eye" as const, onClick: (r: Feeder) => { setSelectedFeeder(r); setViewOpen(true); } },
    { label: "Edit", icon: "PencilLine" as const, onClick: (r: Feeder) => { setSelectedFeeder(r); setFormMode("edit"); setFormOpen(true); } },
    { label: "Delete", icon: "Trash2" as const, variant: "danger" as const, onClick: (r: Feeder) => { setSelectedFeeder(r); setDeleteOpen(true); } },
  ];

  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Feeders"
        data={feeders}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load feeders" : null}
        onRetry={refetch}
        page={page}
        perPage={perPage}
        total={total}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        toolbarActions={
          <Button variant="primary" onClick={() => { setSelectedFeeder(null); setFormMode("create"); setFormOpen(true); }}>
            <Lucide icon="Plus" className="w-4 h-4 mr-2" /> Add Feeder
          </Button>
        }
      />

      <FeederViewDialog open={viewOpen} feeder={selectedFeeder} onClose={() => setViewOpen(false)} />

     <FeederFormDialog
  open={formOpen}
  mode={formMode}
  initial={formMode === "edit" ? selectedFeeder ?? undefined : undefined}
  loading={createMut.isPending || updateMut.isPending}
  onClose={() => setFormOpen(false)}
  onSubmit={(values) => {
    const payload = sanitizePayload(values);
    if (formMode === "create") createMut.mutate(payload as any);
    else if (selectedFeeder?.id) updateMut.mutate({ id: selectedFeeder.id, payload });
  }}
  subDivOptions={
    subDivLoading
      ? []
      : subDivData?.map((s: any) => ({ id: s.id, name: s.name })) ?? []
  }
/>


      <FeederDeleteDialog
        open={deleteOpen}
        feeder={selectedFeeder}
        loading={deleteMut.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedFeeder?.id && deleteMut.mutate(selectedFeeder.id)}
      />
    </div>
  );
}
