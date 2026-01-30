// src/pages/meta/grid-stations/index.tsx
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
  getGridStations,
  createGridStation,
  updateGridStation,
  toggleGridStation,
  deleteGridStation,
  type GridStation,
  type GridStationResponse,
} from "./gridStations";
import {
  GridStationFormDialog,
  GridStationViewDialog,
  GridStationDeleteDialog,
  type GridStationFormValues,
} from "./GridStationDialogs";
import { sanitizePayload } from "@/lib/utils";

export default function GridStationListPage() {
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
  const [selectedGrid, setSelectedGrid] = useState<GridStation | null>(null);

  // list query
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["grid-stations", page, perPage, search],
    queryFn: () => getGridStations({ page, perPage, search }),
  });

  const grids = data?.data ?? [];
  const total = data?.total ?? 0;

  // fetch all sub-divisions for form dropdown
  const { data: subDivData, isFetching: subDivLoading } = useQuery({
    queryKey: ["sub-divisions"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/meta/sub-divisions", {
        params: { per_page: "all", search: "" },
      });
      // meta endpoints sometimes return rows or data
      return data.data || data.rows || [];
    },
  });

  

  const createMut = useMutation({
    mutationFn: async (payload: Partial<GridStation>) => {
      toast.loading("Creating grid station…");
      const res = await createGridStation(sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Grid station created");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["grid-stations"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to create grid station");
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<GridStation>;
    }) => {
      toast.loading("Updating grid station…");
      const res = await updateGridStation(id, sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Grid station updated");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["grid-stations"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to update grid station");
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleGridStation(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grid-stations"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to toggle status"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteGridStation(id),
    onSuccess: () => {
      toast.success("Grid station deleted");
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ["grid-stations"] });
    },
    onError: () => toast.error("Failed to delete grid station"),
  });

  /* ----------------- TABLE CONFIG ----------------- */

  const columns = [
    {
      key: "sub_division",
      label: "Sub Division",
      render: (r: GridStation) => (
        <div>
          <div className="font-medium">{r.sub_division_name}</div>
          <div className="text-xs text-slate-500">{r.sub_division_code}</div>
        </div>
      ),
    },
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    {
      key: "is_active",
      label: "Active",
      render: (r: GridStation) => (
        <FormSwitch>
          <FormSwitch.Input
            type="checkbox"
            checked={r.is_active}
            onChange={(e) =>
              toggleMut.mutate({ id: r.id, is_active: e.target.checked })
            }
          />
        </FormSwitch>
      ),
    },
  ];

  const actions = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (r: GridStation) => {
        setSelectedGrid(r);
        setViewOpen(true);
      },
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r: GridStation) => {
        setSelectedGrid(r);
        setFormMode("edit");
        setFormOpen(true);
      },
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger" as const,
      onClick: (r: GridStation) => {
        setSelectedGrid(r);
        setDeleteOpen(true);
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Grid Stations"
        data={grids}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load grid stations" : null}
        onRetry={refetch}
        page={page}
        perPage={perPage}
        total={total}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
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
              setSelectedGrid(null);
              setFormMode("create");
              setFormOpen(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" /> Add Grid Station
          </Button>
        }
      />

      {/* VIEW */}
      <GridStationViewDialog
        open={viewOpen}
        grid={selectedGrid}
        onClose={() => setViewOpen(false)}
      />

      {/* CREATE / EDIT */}
      <GridStationFormDialog
        open={formOpen}
        mode={formMode}
        initial={formMode === "edit" ? selectedGrid ?? undefined : undefined}
        loading={createMut.isPending || updateMut.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={(values: GridStationFormValues) => {
          const payload = sanitizePayload(values);
          if (formMode === "create") {
            createMut.mutate(payload as any);
          } else if (selectedGrid?.id) {
            updateMut.mutate({ id: selectedGrid.id, payload });
          }
        }}
        subDivisions={
          subDivLoading
            ? []
            : subDivData?.map((s: any) => ({
                id: s.id,
                name: s.name,
                code: s.code, // include code for dropdown
              })) ?? []
        }
      />

      {/* DELETE */}
      <GridStationDeleteDialog
        open={deleteOpen}
        grid={selectedGrid}
        loading={deleteMut.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedGrid?.id && deleteMut.mutate(selectedGrid.id)}
      />
    </div>
  );
}
