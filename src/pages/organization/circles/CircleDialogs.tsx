// src/features/circles/CircleDialogs.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { circleSchema, type CircleFormValues } from "./schemas";
import type { Circle } from "./circles";
import { Controller } from "react-hook-form";
type Mode = "create" | "edit";

export function CircleFormDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<Circle>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CircleFormValues) => void;
  regionOptions?: { id: number; name: string }[];
}) {
  const { open, mode, initial, loading, onClose, onSubmit, regionOptions = [] } = props;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CircleFormValues>({
    resolver: yupResolver(circleSchema),        // ✅ use the schema
    mode: "onChange",
    defaultValues: {
      region_id: undefined as unknown as number,
      code: "",
      name: "",
      cirphno: "",
      cirmob: "",
      circompphno: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        region_id:
          typeof initial?.region_id === "number"
            ? initial.region_id
            : (regionOptions[0]?.id ?? (undefined as unknown as number)),
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        cirphno: initial?.cirphno ?? "",
        cirmob: initial?.cirmob ?? "",
        circompphno: initial?.circompphno ?? "",
      });
    }
  }, [open, initial, reset, regionOptions]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {mode === "create" ? "Add Circle" : "Edit Circle"}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Region */}
           {/* Region */}
<div>
  <label className="text-xs font-medium text-slate-500">Region</label>
  <Controller
    name="region_id"
    control={control}
    render={({ field }) => (
      <FormSelect
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
        value={field.value ?? ""}
        className="mt-1"
      >
        <option value="">Select region</option>
        {regionOptions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </FormSelect>
    )}
  />
  {errors.region_id && (
    <p className="text-xs text-red-500 mt-1">{errors.region_id.message}</p>
  )}
</div>


            {/* Code */}
            <div>
              <label className="text-xs font-medium text-slate-500">Code</label>
              <FormInput {...register("code")} placeholder="C001" className="mt-1" />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Name</label>
              <FormInput {...register("name")} placeholder="Lodhran Circle" className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Phones */}
              <div>
                <label className="text-xs font-medium text-slate-500">Circle Phone</label>
                <FormInput {...register("cirphno")} placeholder="061-1234567" className="mt-1" />
                {errors.cirphno && (
                  <p className="text-xs text-red-500 mt-1">{errors.cirphno.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Mobile</label>
                <FormInput {...register("cirmob")} placeholder="+92300..." className="mt-1" />
                {errors.cirmob && (
                  <p className="text-xs text-red-500 mt-1">{errors.cirmob.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Complaints Phone</label>
                <FormInput
                  {...register("circompphno")}
                  placeholder="061-7654321"
                  className="mt-1"
                />
                {errors.circompphno && (
                  <p className="text-xs text-red-500 mt-1">{errors.circompphno.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline-secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading || isSubmitting || !isValid}>
                {loading || isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}


export function CircleViewDialog(props: {
  open: boolean;
  circle?: Circle | null;
  onClose: () => void;
}) {
  const { open, circle, onClose } = props;
  if (!circle) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Circle Details</div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {circle.name}
            </div>
            <div>
              <span className="font-medium">Code:</span> {circle.code}
            </div>
            <div>
              <span className="font-medium">Region ID:</span> {circle.region_id}
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              {circle.is_active ? "Active" : "Inactive"}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {circle.cirphno || "—"}
            </div>
            <div>
              <span className="font-medium">Mobile:</span> {circle.cirmob || "—"}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Complaints Phone:</span>{" "}
              {circle.circompphno || "—"}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Updated:</span>{" "}
              {new Date(circle.updated_at).toLocaleString()}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export function CircleDeleteDialog(props: {
  open: boolean;
  circle?: Circle | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, circle, loading, onClose, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 text-center space-y-4">
          <Lucide icon="AlertTriangle" className="w-12 h-12 mx-auto text-danger" />
          <div className="text-lg font-medium">Delete Circle?</div>
          <p className="text-slate-600 text-sm">
            This action cannot be undone. This will permanently delete <b>{circle?.name}</b>.
          </p>
          <div className="flex justify-center gap-2 pt-3">
            <Button variant="outline-secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
