"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { divisionSchema, type DivisionFormValues } from "./schemas";
import type { Division } from "./divisions";

type Mode = "create" | "edit";

// CREATE / EDIT
export function DivisionFormDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<Division>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: DivisionFormValues) => void;
  circleOptions?: { id: number; name: string }[];
}) {
  const { open, mode, initial, loading, onClose, onSubmit, circleOptions = [] } = props;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<DivisionFormValues>({
    resolver: yupResolver(divisionSchema),
    mode: "onChange",
    defaultValues: {
      circle_id: undefined as unknown as number,
      code: "",
      name: "",
      divphno: "",
      divmob: "",
      divcompphno: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        circle_id: initial?.circle_id ?? undefined,
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        divphno: initial?.divphno ?? "",
        divmob: initial?.divmob ?? "",
        divcompphno: initial?.divcompphno ?? "",
        description: initial?.description ?? "",
      });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {mode === "create" ? "Add Division" : "Edit Division"}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Circle */}
            <div>
              <label className="text-xs font-medium text-slate-500">Circle</label>
              <Controller
                name="circle_id"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                    className="mt-1"
                  >
                    <option value="">Select circle</option>
                    {circleOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
              {errors.circle_id && (
                <p className="text-xs text-red-500 mt-1">{errors.circle_id.message}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="text-xs font-medium text-slate-500">Code</label>
              <FormInput {...register("code")} placeholder="D001" className="mt-1" />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-slate-500">Name</label>
              <FormInput {...register("name")} placeholder="Vehari Division" className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Phones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Phone</label>
                <FormInput {...register("divphno")} placeholder="067-1234567" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Mobile</label>
                <FormInput {...register("divmob")} placeholder="+923..." className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Complaints</label>
                <FormInput {...register("divcompphno")} placeholder="067-7654321" className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Description (optional)"
                className="mt-1 block w-full rounded-md border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 text-sm p-3"
              />
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

// VIEW
export function DivisionViewDialog(props: {
  open: boolean;
  division?: Division | null;
  onClose: () => void;
}) {
  const { open, division, onClose } = props;
  if (!division) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Division Details</div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Name:</span> {division.name}</div>
            <div><span className="font-medium">Code:</span> {division.code}</div>
            <div><span className="font-medium">Circle ID:</span> {division.circle_id}</div>
            <div><span className="font-medium">Status:</span> {division.is_active ? "Active" : "Inactive"}</div>
            <div><span className="font-medium">Phone:</span> {division.divphno || "—"}</div>
            <div><span className="font-medium">Mobile:</span> {division.divmob || "—"}</div>
            <div className="col-span-2">
              <span className="font-medium">Complaints Phone:</span> {division.divcompphno || "—"}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Description:</span> {division.description || "—"}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Updated:</span> {new Date(division.updated_at).toLocaleString()}
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

// DELETE
export function DivisionDeleteDialog(props: {
  open: boolean;
  division?: Division | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, division, loading, onClose, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 text-center space-y-4">
          <Lucide icon="AlertTriangle" className="w-12 h-12 mx-auto text-danger" />
          <div className="text-lg font-medium">Delete Division?</div>
          <p className="text-slate-600 text-sm">
            This action cannot be undone. This will permanently delete <b>{division?.name}</b>.
          </p>
          <div className="flex justify-center gap-2 pt-3">
            <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" onClick={onConfirm} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
