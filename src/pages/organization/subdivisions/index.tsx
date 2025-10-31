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
  SubDivisionFormDialog,
  SubDivisionViewDialog,
  SubDivisionDeleteDialog,
} from "./SubDivisionDialogs";
import {
  createSubDivision,
  updateSubDivision,
  toggleSubDivision,
  deleteSubDivision,
  type SubDivision,
  type SubDivisionResponse,
} from "./subdivisions";
import { sanitizePayload } from "@/lib/utils";

// --- Page Component ---
export default function SubDivisionsListPage() {
  const qc = useQueryClient();

  // Pagination + Filters
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSubDiv, setSelectedSubDiv] = useState<SubDivision | null>(null);

  // --- Fetch Circles (for dropdown) ---
  const { data: circleData, isFetching: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/meta/circles`, {
        params: { per_page: 9999 },
      });
      return data.data || [];
    },
  });

  // --- Fetch SubDivisions ---
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["subdivisions", page, perPage, search],
    queryFn: async () => {
      const { data } = await api.get<SubDivisionResponse>(`/api/v1/meta/sub-divisions`, {
        params: { page, per_page: perPage, search },
      });
      return data;
    },
  });

  const subDivisions = data?.data ?? [];
  const total = data?.total ?? 0;

  // --- Mutations ---
  const createMut = useMutation({
    mutationFn: async (payload: Omit<SubDivision, "id">) => {
      toast.loading("Creating sub-division…");
      const res = await createSubDivision(sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Sub-division created successfully");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["subdivisions"] });
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to create sub-division");
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<SubDivision>;
    }) => {
      toast.loading("Updating sub-division…");
      const res = await updateSubDivision(id, sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Sub-division updated successfully");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["subdivisions"] });
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to update sub-division");
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      toast.loading("Updating status…");
      const res = await toggleSubDivision(id, is_active);
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Status updated successfully");
      qc.invalidateQueries({ queryKey: ["subdivisions"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to toggle status");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      toast.loading("Deleting sub-division…");
      const res = await deleteSubDivision(id);
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Sub-division deleted successfully");
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ["subdivisions"] });
    },
    onError: () => {
      toast.dismiss();
      toast.error("Failed to delete sub-division");
    },
  });

  // --- Columns ---
  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    {
      key: "is_active",
      label: "Status",
      render: (r: SubDivision) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
          <FormSwitch>
            <FormSwitch.Input
              type="checkbox"
              checked={!!r.is_active}
              onChange={(e) =>
                toggleMut.mutate({ id: r.id, is_active: e.target.checked })
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
      render: (r: SubDivision) =>
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
      onClick: (r: SubDivision) => {
        setSelectedSubDiv(r);
        setViewOpen(true);
      },
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r: SubDivision) => {
        setSelectedSubDiv(r);
        setFormMode("edit");
        setFormOpen(true);
      },
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger" as const,
      onClick: (r: SubDivision) => {
        setSelectedSubDiv(r);
        setDeleteOpen(true);
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Sub-Divisions"
        data={subDivisions}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load sub-divisions" : null}
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
              setSelectedSubDiv(null);
              setFormMode("create");
              setFormOpen(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Add Sub-Division
          </Button>
        }
      />

      {/* View Dialog */}
      <SubDivisionViewDialog
        open={viewOpen}
        subDivision={selectedSubDiv}
        onClose={() => setViewOpen(false)}
      />

      {/* Form Dialog */}
      <SubDivisionFormDialog
        open={formOpen}
        mode={formMode}
        initial={formMode === "edit" ? selectedSubDiv ?? undefined : undefined}
        loading={createMut.isPending || updateMut.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => {
          const payload = sanitizePayload(values);
          if (formMode === "create") createMut.mutate(payload as any);
          else if (selectedSubDiv?.id)
            updateMut.mutate({ id: selectedSubDiv.id, payload });
        }}
        circleOptions={
          circlesLoading
            ? []
            : circleData?.map((c: any) => ({ id: c.id, name: c.name })) ?? []
        }
      />

      {/* Delete Dialog */}
      <SubDivisionDeleteDialog
        open={deleteOpen}
        subDivision={selectedSubDiv}
        loading={deleteMut.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedSubDiv?.id && deleteMut.mutate(selectedSubDiv.id)}
      />
    </div>
  );
}
