
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { regionSchema, type RegionFormValues } from "./schemas";
import type { Region } from "./regions";

type Mode = "create" | "edit";

export function RegionFormDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<Region>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: RegionFormValues) => void;
}) {
  const { open, mode, initial, loading, onClose, onSubmit } = props;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegionFormValues>({
    resolver: yupResolver(regionSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: initial?.code ?? "",
        name: initial?.name ?? "",
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
              {mode === "create" ? "Add Region" : "Edit Region"}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-slate-500">Code</label>
              <FormInput
                {...register("code")}
                placeholder="MEP"
                className="mt-1"
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Name</label>
              <FormInput
                {...register("name")}
                placeholder="MEPCO Region"
                className="mt-1"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Description</label>
              <textarea
                {...(register("description") as any)}
                rows={3}
                placeholder="Description (optional)"
                className="mt-1 block w-full rounded-md border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 text-sm p-3"
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
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
                {loading || isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export function RegionViewDialog(props: {
  open: boolean;
  region?: Region | null;
  onClose: () => void;
}) {
  const { open, region, onClose } = props;
  if (!region) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Region Details</div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Name:</span> {region.name}</div>
            <div><span className="font-medium">Code:</span> {region.code}</div>
            <div><span className="font-medium">Status:</span> {region.is_active ? "Active" : "Inactive"}</div>
            <div><span className="font-medium">Updated:</span> {new Date(region.updated_at).toLocaleString()}</div>
            <div className="col-span-2">
              <span className="font-medium">Description:</span>
              <div className="mt-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {region.description || "—"}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export function RegionDeleteDialog(props: {
  open: boolean;
  region?: Region | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, region, loading, onClose, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 text-center space-y-4">
          <Lucide icon="AlertTriangle" className="w-12 h-12 mx-auto text-danger" />
          <div className="text-lg font-medium">Delete Region?</div>
          <p className="text-slate-600 text-sm">
            This action cannot be undone. This will permanently delete <b>{region?.name}</b>.
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
