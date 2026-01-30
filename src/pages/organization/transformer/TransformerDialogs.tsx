"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { transformerSchema, TransformerFormValues } from "./schema";
import { getRelatedBySubDivision } from "../feeders/related";

type Mode = "create" | "edit";

export function TransformerFormDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<TransformerFormValues>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: TransformerFormValues) => void;
  subDivOptions?: { id: number; name: string }[];
}) {
  const { open, mode, initial, loading, onClose, onSubmit, subDivOptions = [] } = props;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TransformerFormValues>({
    resolver: yupResolver(transformerSchema),
    mode: "onChange",
    defaultValues: {
      sub_division_id: undefined as unknown as number,
      feeder_id: undefined as unknown as number,
      transformer_id: "",
      transformer_id_by_disco: "",
      location_id: "",
      transformer_ref_no: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  const subDivId = useWatch({ control, name: "sub_division_id" });
  const [feeders, setFeeders] = useState<{ id: number; name: string }[]>([]);
  const [loadingFeeders, setLoadingFeeders] = useState(false);

  useEffect(() => {
    if (open) {
      reset(initial || {});
    }
  }, [open, initial, reset]);

  useEffect(() => {
    if (subDivId) {
      setLoadingFeeders(true);
      getRelatedBySubDivision(subDivId)
        .then((res) => {
          const list = res?.lists?.feeders ?? [];
          setFeeders(list.map((f: any) => ({ id: f.id, name: f.name })));
        })
        .catch(() => setFeeders([]))
        .finally(() => setLoadingFeeders(false));
    } else setFeeders([]);
  }, [subDivId]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {mode === "create" ? "Add Transformer" : "Edit Transformer"}
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
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

              {/* Feeder */}
              <Controller
                name="feeder_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Feeder {loadingFeeders && "(Loading...)"}
                    </label>
                    <FormSelect
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={!subDivId || loadingFeeders}
                    >
                      <option value="">
                        {!subDivId
                          ? "Select Sub-Division first"
                          : loadingFeeders
                          ? "Loading Feeders..."
                          : "Select Feeder"}
                      </option>
                      {feeders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                )}
              />

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Transformer ID
                </label>
                <FormInput {...register("transformer_id")} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Transformer Ref No
                </label>
                <FormInput {...register("transformer_ref_no")} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Disco Transformer ID
                </label>
                <FormInput {...register("transformer_id_by_disco")} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Location ID
                </label>
                <FormInput {...register("location_id")} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Latitude
                </label>
                <FormInput {...register("latitude")} />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Longitude
                </label>
                <FormInput {...register("longitude")} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Address
              </label>
              <textarea
                {...register("address")}
                rows={3}
                className="mt-1 block w-full rounded-md border-slate-200 bg-slate-50 p-3 text-sm"
              />
            </div>

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
export function TransformerViewDialog({
  open,
  transformer,
  onClose,
}: {
  open: boolean;
  transformer?: any | null;
  onClose: () => void;
}) {
  if (!transformer) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Transformer Details</h3>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Transformer ID:</span>{" "}
              {transformer.transformer_id || "—"}
            </div>
            <div>
              <span className="font-medium">Disco ID:</span>{" "}
              {transformer.transformer_id_by_disco || "—"}
            </div>
            <div>
              <span className="font-medium">Ref No:</span>{" "}
              {transformer.transformer_ref_no || "—"}
            </div>
            <div>
              <span className="font-medium">Location ID:</span>{" "}
              {transformer.location_id || "—"}
            </div>
            <div>
              <span className="font-medium">Feeder ID:</span>{" "}
              {transformer.feeder_id || "—"}
            </div>
            <div>
              <span className="font-medium">Sub-Division ID:</span>{" "}
              {transformer.sub_division_id || "—"}
            </div>
            <div>
              <span className="font-medium">Latitude:</span>{" "}
              {transformer.latitude || "—"}
            </div>
            <div>
              <span className="font-medium">Longitude:</span>{" "}
              {transformer.longitude || "—"}
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              {transformer.is_active ? (
                <span className="text-green-600 font-semibold">Active</span>
              ) : (
                <span className="text-red-500 font-semibold">Inactive</span>
              )}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Address:</span>{" "}
              {transformer.address || "—"}
            </div>
            <div className="col-span-2 text-xs text-slate-500 mt-2">
              <p>
                <span className="font-medium">Created:</span>{" "}
                {new Date(transformer.created_at).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Updated:</span>{" "}
                {new Date(transformer.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
