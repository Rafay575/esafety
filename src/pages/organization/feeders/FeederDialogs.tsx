"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Feeder } from "./feeders";
import * as yup from "yup";
import { getRelatedBySubDivision } from "./related";

// --- Schema ---
const feederSchema = yup.object({
  sub_division_id: yup
    .number()
    .required("Sub-Division is required")
    .typeError("Sub-Division is required"),
  grid_station_id: yup.number().nullable(),
  code: yup.string().trim().required("Code is required").max(20),
  name: yup.string().trim().required("Name is required").max(120),
  voltage_level: yup.string().nullable().max(20),
  lat: yup.string().nullable().max(30),
  lng: yup.string().nullable().max(30),
  description: yup.string().nullable().max(500),
});
export type FeederFormValues = yup.InferType<typeof feederSchema>;

type Mode = "create" | "edit";

export function FeederFormDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<Feeder>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: FeederFormValues) => void;
  subDivOptions?: { id: number; name: string }[];
}) {
  const {
    open,
    mode,
    initial,
    loading,
    onClose,
    onSubmit,
    subDivOptions = [],
  } = props;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FeederFormValues>({
    resolver: yupResolver(feederSchema),
    mode: "onChange",
    defaultValues: {
      sub_division_id: undefined as unknown as number,
      grid_station_id: undefined as unknown as number,
      code: "",
      name: "",
      voltage_level: "",
      lat: "",
      lng: "",
      description: "",
    },
  });

  const subDivId = useWatch({ control, name: "sub_division_id" });
  const [gridStations, setGridStations] = useState<{ id: number; name: string }[]>([]);
  const [loadingGrids, setLoadingGrids] = useState(false);

  // Load initial form values when modal opens
  useEffect(() => {
    if (open) {
      reset({
        sub_division_id: initial?.sub_division_id ?? undefined,
        grid_station_id: initial?.grid_station_id ?? undefined,
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        voltage_level: initial?.voltage_level ?? "",
        lat: initial?.lat ?? "",
        lng: initial?.lng ?? "",
        description: initial?.description ?? "",
      });
    }
  }, [open, initial, reset]);

  // Fetch grid stations when sub-division changes
  useEffect(() => {
    if (subDivId) {
      setLoadingGrids(true);
      getRelatedBySubDivision(subDivId)
        .then((res) => {
          const grids = res?.lists?.grid_stations ?? [];
          setGridStations(grids.map((g: any) => ({ id: g.id, name: g.name })));
        })
        .catch(() => setGridStations([]))
        .finally(() => setLoadingGrids(false));
    } else {
      setGridStations([]);
    }
  }, [subDivId]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {mode === "create" ? "Add Feeder" : "Edit Feeder"}
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {/* Sub-Division */}
              <Controller
                name="sub_division_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Sub-Division
                    </label>
                    <FormSelect
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                      className="mt-1"
                    >
                      <option value="">Select Sub-Division</option>
                      {subDivOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </FormSelect>
                    {errors.sub_division_id && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.sub_division_id.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Grid Station (Dynamic) */}
              <Controller
                name="grid_station_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Grid Station {loadingGrids && "(Loading...)"}
                    </label>
                    <FormSelect
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                      className="mt-1"
                      disabled={!subDivId || loadingGrids}
                    >
                      <option value="">
                        {!subDivId
                          ? "Select Sub-Division first"
                          : loadingGrids
                          ? "Loading grid stations..."
                          : "Select Grid Station"}
                      </option>
                      {gridStations.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                )}
              />

              {/* Code */}
              <div>
                <label className="text-xs font-medium text-slate-500">Code</label>
                <FormInput
                  {...register("code")}
                  placeholder="Enter Feeder Code"
                  className="mt-1"
                />
                {errors.code && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-slate-500">Name</label>
                <FormInput
                  {...register("name")}
                  placeholder="Enter Feeder Name"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Voltage */}
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Voltage Level
                </label>
                <FormInput
                  {...register("voltage_level")}
                  placeholder="11KV"
                  className="mt-1"
                />
              </div>

              {/* Lat / Lng */}
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Latitude
                </label>
                <FormInput {...register("lat")} placeholder="30.12345" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Longitude
                </label>
                <FormInput {...register("lng")} placeholder="71.12345" className="mt-1" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-slate-500">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Optional description"
                className="mt-1 block w-full rounded-md border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 text-sm p-3"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline-secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || isSubmitting || !isValid}
              >
                {loading || isSubmitting
                  ? "Saving..."
                  : mode === "create"
                  ? "Create"
                  : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

// --- VIEW DIALOG ---
export function FeederViewDialog({
  open,
  feeder,
  onClose,
}: {
  open: boolean;
  feeder?: Feeder | null;
  onClose: () => void;
}) {
  if (!feeder) return null;
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Feeder Details</div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Code:</span> {feeder.code}</div>
            <div><span className="font-medium">Name:</span> {feeder.name}</div>
            <div><span className="font-medium">Voltage:</span> {feeder.voltage_level || "—"}</div>
            <div><span className="font-medium">Status:</span> {feeder.is_active ? "Active" : "Inactive"}</div>
            <div><span className="font-medium">Latitude:</span> {feeder.lat || "—"}</div>
            <div><span className="font-medium">Longitude:</span> {feeder.lng || "—"}</div>
            <div className="col-span-2"><span className="font-medium">Description:</span> {feeder.description || "—"}</div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

// --- DELETE DIALOG ---
export function FeederDeleteDialog({
  open,
  feeder,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  feeder?: Feeder | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 text-center space-y-4">
          <Lucide icon="AlertTriangle" className="w-12 h-12 mx-auto text-danger" />
          <div className="text-lg font-medium">Delete Feeder?</div>
          <p className="text-slate-600 text-sm">
            This action cannot be undone. This will permanently delete{" "}
            <b>{feeder?.name}</b>.
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
