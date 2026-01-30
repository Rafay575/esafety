// src/pages/meta/grid-stations/GridStationDialogs.tsx
"use client";

import { useEffect } from "react";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { GridStation } from "./gridStations";
import Lucide from "@/components/Base/Lucide";

/* Validation schema */
const schema = yup.object({
  sub_division_id: yup.number().required("Sub-Division is required"),
  code: yup.string().required("Code is required"),
  name: yup.string().required("Name is required"),
});

export type GridStationFormValues = yup.InferType<typeof schema>;

export function GridStationFormDialog({
  open,
  mode,
  initial,
  subDivisions,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<GridStation>;
  subDivisions: any[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: GridStationFormValues) => void;
}) {
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<GridStationFormValues>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        sub_division_id: initial?.sub_division_id ?? undefined,
        code: initial?.code ?? "",
        name: initial?.name ?? "",
      });
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Add Grid Station" : "Edit Grid Station"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Sub Division */}
            <div>
              <label className="text-sm">Sub Division</label>
              <Controller
                name="sub_division_id"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value))
                    }
                  >
                    <option value="">Select Sub Division</option>
                    {subDivisions.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
              <p className="text-red-500 text-xs">{errors.sub_division_id?.message}</p>
            </div>

            {/* Code */}
            <div>
              <label className="text-sm">Code</label>
              <FormInput {...register("code")} placeholder="G001" />
              <p className="text-red-500 text-xs">{errors.code?.message}</p>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm">Name</label>
              <FormInput {...register("name")} placeholder="Grid 1" />
              <p className="text-red-500 text-xs">{errors.name?.message}</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline-secondary" onClick={onClose}>
  Cancel
</Button>


              <Button type="submit" variant="primary" disabled={loading}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

/* VIEW DIALOG */
export function GridStationViewDialog({
  open,
  grid,
  onClose,
}: {
  open: boolean;
  grid: GridStation | null;
  onClose: () => void;
}) {
  if (!grid) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Grid Station Details</h2>

          <div className="space-y-1 text-sm">
            <p><strong>Code:</strong> {grid.code}</p>
            <p><strong>Name:</strong> {grid.name}</p>
            <p><strong>Sub Division:</strong> {grid.sub_division_name}</p>
            <p><strong>Sub Division Code:</strong> {grid.sub_division_code}</p>
            <p><strong>Status:</strong> {grid.is_active ? "Active" : "Inactive"}</p>
          </div>

          <Button className="mt-4" variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}


/* ===========================
   DELETE DIALOG
=========================== */
export function GridStationDeleteDialog({
  open,
  grid,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  grid?: GridStation | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 text-center space-y-4">
          <Lucide
            icon="AlertTriangle"
            className="w-12 h-12 mx-auto text-danger"
          />
          <div className="text-lg font-medium">Delete Grid Station?</div>
          <p className="text-slate-600 text-sm">
            This action cannot be undone. This will permanently delete{" "}
            <b>{grid?.name}</b>.
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
