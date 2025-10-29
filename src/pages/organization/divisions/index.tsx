"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GenericTable, type TableAction } from "@/components/Base/GenericTable";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormSwitch } from "@/components/Base/Form";
import {
  getDivisions,
  createDivision,
  updateDivision,
  toggleDivision,
  deleteDivision,
  getCircleOptions,
  type Division,
  type DivisionResponse,
} from "./divisions";
import {
  DivisionFormDialog,
  DivisionViewDialog,
  DivisionDeleteDialog,
} from "./DivisionDialogs";

export default function DivisionsListPage() {
  const qc = useQueryClient();

  // table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // dialogs state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);

  // fetch divisions
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["divisions", page, perPage, search],
    queryFn: () => getDivisions({ page, perPage, search }),
  });

  const divisions = data?.data ?? [];
  const total = data?.total ?? 0;

  // circles for dropdown
  const { data: circleOptions = [] } = useQuery({
    queryKey: ["circle-options"],
    queryFn: () => getCircleOptions(),
  });

  // mutations
  const createMut = useMutation({
    mutationFn: async (payload: Parameters<typeof createDivision>[0]) => {
      toast.loading("Creating division…");
      return await createDivision(payload);
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Division created successfully");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["divisions"] });
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to create division");
    },
  });

  const updateMut = useMutation({
    mutationFn: async (p: { id: number; payload: Parameters<typeof updateDivision>[1] }) => {
      toast.loading("Updating division…");
      return await updateDivision(p.id, p.payload);
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Division updated successfully");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["divisions"] });
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to update division");
    },
  });

  const toggleMut = useMutation({
    mutationFn: async (p: { id: number; is_active: boolean }) => {
      toast.loading("Updating status…");
      return await toggleDivision(p.id, p.is_active);
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Status updated successfully");
      // no full-table spinner — just refetch silently
      qc.invalidateQueries({ queryKey: ["divisions"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to toggle status");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      toast.loading("Deleting division…");
      return await deleteDivision(id);
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Division deleted");
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ["divisions"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to delete division");
    },
  });

  // columns
  const columns = [
    { key: "name", label: "Division Name" },
    { key: "code", label: "Code" },
    {
      key: "is_active",
      label: "Status",
      render: (r: Division) => (
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
      render: (r: Division) =>
        new Date(r.updated_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  // actions
  const actions: TableAction<Division>[] = [
    {
      label: "View",
      icon: "Eye",
      onClick: (r) => {
        setSelectedDivision(r);
        setViewOpen(true);
      },
    },
    {
      label: "Edit",
      icon: "PencilLine",
      onClick: (r) => {
        setSelectedDivision(r);
        setFormMode("edit");
        setFormOpen(true);
      },
    },
    {
      label: "Delete",
      icon: "Trash2",
      variant: "danger",
      onClick: (r) => {
        setSelectedDivision(r);
        setDeleteOpen(true);
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Divisions"
        data={divisions}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load divisions" : null}
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
              setSelectedDivision(null);
              setFormMode("create");
              setFormOpen(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Add Division
          </Button>
        }
      />

      {/* View */}
      <DivisionViewDialog
        open={viewOpen}
        division={selectedDivision}
        onClose={() => setViewOpen(false)}
      />

      {/* Create/Edit */}
      <DivisionFormDialog
        open={formOpen}
        mode={formMode}
        initial={formMode === "edit" ? selectedDivision ?? undefined : undefined}
        loading={createMut.isPending || updateMut.isPending}
        circleOptions={circleOptions}
        onClose={() => setFormOpen(false)}
      onSubmit={(values) => {
  // --- Clean nullables into undefineds for API consistency ---
  const payload: Record<string, unknown> = {};

  (Object.keys(values) as (keyof typeof values)[]).forEach((key) => {
    const val = values[key];
    payload[key] = val === null ? undefined : val;
  });

  if (formMode === "create") {
    createMut.mutate(payload as Parameters<typeof createDivision>[0]);
  } else if (selectedDivision?.id) {
    updateMut.mutate({
      id: selectedDivision.id,
      payload: payload as Parameters<typeof updateDivision>[1],
    });
  }
}}
      />

      {/* Delete */}
      <DivisionDeleteDialog
        open={deleteOpen}
        division={selectedDivision}
        loading={deleteMut.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedDivision?.id && deleteMut.mutate(selectedDivision.id)}
      />
    </div>
  );
}
