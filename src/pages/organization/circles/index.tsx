// src/features/circles/index.tsx
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
  getCircles,
  createCircle as createCircleApi,
  updateCircle as updateCircleApi,
  toggleCircle as toggleCircleApi,
  deleteCircle as deleteCircleApi,
  type Circle,
  type CircleResponse,
} from "./circles";
import { CircleFormDialog, CircleViewDialog, CircleDeleteDialog } from "./CircleDialogs";

// optional: fetch regions for the form select
async function fetchRegionsOptions() {
  const { data } = await api.get(`/api/v1/meta/regions`, { params: { per_page: 1000, page: 1 } });
  const list = data?.data || [];
  return list.map((r: any) => ({ id: r.id, name: r.name }));
}

export default function CirclesListPage() {
  const qc = useQueryClient();

  // Paging + search
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Circle | null>(null);

  // Fetch Circles
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["circles", page, perPage, search],
    queryFn: () => getCircles({ page, perPage, search }),
  });

  const { data: regionOptions = [] } = useQuery({
    queryKey: ["regions-options"],
    queryFn: fetchRegionsOptions,
  });

  const circles = data?.data ?? [];
  const total = data?.total ?? 0;

  // Mutations (toast.loading → dismiss → success/error)
  const createCircle = useMutation({
    mutationFn: async (payload: any) => {
      toast.loading("Creating circle…");
      const res = await createCircleApi(payload);
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Circle created successfully");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to create circle");
    },
  });

  const updateCircle = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      toast.loading("Updating circle…");
      const res = await updateCircleApi(id, payload);
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Circle updated successfully");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to update circle");
    },
  });

  const toggleCircle = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      toast.loading("Updating status…");
      const res = await toggleCircleApi(id, is_active);
      return res;
    },
    onSuccess: (_, vars) => {
      toast.dismiss();
      toast.success(`Status ${vars.is_active ? "activated" : "deactivated"} successfully`);
      qc.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to toggle status");
    },
  });

  const deleteCircle = useMutation({
    mutationFn: async (id: number) => {
      toast.loading("Deleting circle…");
      const res = await deleteCircleApi(id);
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Circle deleted successfully");
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to delete circle");
    },
  });

  // Columns
  const columns = [
    { key: "name", label: "Circle Name" },
    { key: "code", label: "Code" },
    { key: "cirphno", label: "Phone" },
    { key: "cirmob", label: "Mobile" },
    { key: "circompphno", label: "Complaints" },
    {
      key: "is_active",
      label: "Status",
      render: (c: Circle) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
          <FormSwitch>
            <FormSwitch.Input
              type="checkbox"
              checked={!!c.is_active}
              onChange={(e) => toggleCircle.mutate({ id: c.id, is_active: e.target.checked })}
            />
          </FormSwitch>
        </div>
      ),
      className: "text-center",
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (c: Circle) =>
        new Date(c.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    },
  ];

  // Row actions
  const actions = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (c: Circle) => {
        setSelected(c);
        setViewOpen(true);
      },
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (c: Circle) => {
        setSelected(c);
        setFormMode("edit");
        setFormOpen(true);
      },
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger" as const,
      onClick: (c: Circle) => {
        setSelected(c);
        setDeleteOpen(true);
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Circles"
        data={circles}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load circles" : null}
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
              setSelected(null);
              setFormMode("create");
              setFormOpen(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Add Circle
          </Button>
        }
      />

      {/* View */}
      <CircleViewDialog open={viewOpen} circle={selected} onClose={() => setViewOpen(false)} />

      {/* Create/Edit */}
      <CircleFormDialog
        open={formOpen}
        mode={formMode}
        initial={formMode === "edit" ? selected ?? undefined : undefined}
        loading={createCircle.isPending || updateCircle.isPending}
        onClose={() => setFormOpen(false)}
        regionOptions={regionOptions}
        onSubmit={(values) => {
          if (formMode === "create") {
            createCircle.mutate(values);
          } else if (selected?.id) {
            updateCircle.mutate({ id: selected.id, payload: values });
          }
        }}
      />

      {/* Delete */}
      <CircleDeleteDialog
        open={deleteOpen}
        circle={selected}
        loading={deleteCircle.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selected?.id && deleteCircle.mutate(selected.id)}
      />
    </div>
  );
}
