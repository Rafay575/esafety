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
  getTransformers,
  createTransformer,
  updateTransformer,
  toggleTransformer,
  deleteTransformer,
  Transformer,
} from "./transformers";
import {
  TransformerFormDialog,
  TransformerViewDialog,
} from "./TransformerDialogs";
import { sanitizePayload } from "@/lib/utils";

export default function TransformerListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Transformer | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["transformers", page, perPage, search],
    queryFn: () => getTransformers({ page, perPage, search }),
  });

  const { data: subDivData } = useQuery({
    queryKey: ["sub-divisions"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/meta/sub-divisions", {
        params: { per_page: "all", search: "" },
      });
      return data.data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async (payload: Partial<Transformer>) => {
      toast.loading("Creating transformer...");
      const res = await createTransformer(sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Transformer created");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["transformers"] });
    },
    onError: () => toast.error("Failed to create transformer"),
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Transformer>;
    }) => {
      toast.loading("Updating transformer...");
      const res = await updateTransformer(id, sanitizePayload(payload));
      return res;
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Transformer updated");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["transformers"] });
    },
    onError: () => toast.error("Failed to update transformer"),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleTransformer(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transformers"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to toggle status"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTransformer(id),
    onSuccess: () => {
      toast.success("Transformer deleted");
      qc.invalidateQueries({ queryKey: ["transformers"] });
    },
    onError: () => toast.error("Failed to delete transformer"),
  });

  const columns = [
    { key: "transformer_id", label: "Transformer ID" },
    { key: "feeder_id", label: "Feeder ID" },
    { key: "transformer_ref_no", label: "Reference No" },
    { key: "address", label: "Address" },
    {
      key: "is_active",
      label: "Status",
      render: (r: Transformer) => (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex justify-center"
        >
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
    },
  ];

  const actions = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (r: Transformer) => {
        setSelected(r);
        setViewOpen(true);
      },
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r: Transformer) => {
        setSelected(r);
        setFormMode("edit");
        setFormOpen(true);
      },
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger" as const,
      onClick: (r: Transformer) => deleteMut.mutate(r.id),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <GenericTable
        title="Transformers"
        data={data?.data || []}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load transformers" : null}
        onRetry={refetch}
        page={page}
        perPage={perPage}
        total={data?.total || 0}
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
              setSelected(null);
              setFormMode("create");
              setFormOpen(true);
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Add Transformer
          </Button>
        }
      />

      <TransformerFormDialog
        open={formOpen}
        mode={formMode}
        initial={formMode === "edit" ? selected ?? undefined : undefined}
        loading={createMut.isPending || updateMut.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => {
          const payload = sanitizePayload(values);
          if (formMode === "create") createMut.mutate(payload);
          else if (selected?.id) updateMut.mutate({ id: selected.id, payload });
        }}
        subDivOptions={
          subDivData?.map((s: any) => ({ id: s.id, name: s.name })) ?? []
        }
      />
      <TransformerViewDialog
        open={viewOpen}
        transformer={selected}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
