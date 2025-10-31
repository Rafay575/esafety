import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { subDivisionSchema, type SubDivisionFormValues } from "./schemas";
import type { SubDivision } from "./subdivisions";
import { getRelatedByCircle } from "./lookups"; // 👈 added import
import { Controller } from "react-hook-form";

type Mode = "create" | "edit";

export function SubDivisionFormDialog(props: {
  open: boolean;
  mode: Mode;
  initial?: Partial<SubDivision>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: SubDivisionFormValues) => void;
  divisionOptions?: { id: number; name: string }[];
  circleOptions?: { id: number; name: string }[];
}) {
  const {
    open,
    mode,
    initial,
    loading,
    onClose,
    onSubmit,
    divisionOptions = [],
    circleOptions = [],
  } = props;

  const [divisions, setDivisions] = useState<{ id: number; name: string }[]>([]);
  const [loadingDivs, setLoadingDivs] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SubDivisionFormValues>({
    resolver: yupResolver(subDivisionSchema),
    mode: "onChange",
    defaultValues: {
      division_id: undefined as unknown as number,
      circle_id: undefined as unknown as number,
      code: "",
      name: "",
      sdivphno: "",
      sdivmob: "",
      sdivcompphno: "",
      description: "",
    },
  });

  const circleId = watch("circle_id");

  // --- Fetch divisions when circle changes ---
  useEffect(() => {
    if (circleId) {
      setLoadingDivs(true);
      getRelatedByCircle(circleId)
        .then((res) => {
          setDivisions(res?.lists?.divisions ?? []);
          // Reset division_id if circle changes
          setValue("division_id", undefined as unknown as number);
        })
        .catch(() => setDivisions([]))
        .finally(() => setLoadingDivs(false));
    } else {
      setDivisions([]);
    }
  }, [circleId, setValue]);

  // --- Reset form when dialog opens ---
  useEffect(() => {
    if (open) {
      reset({
        division_id: initial?.division_id ?? undefined,
        circle_id: initial?.circle_id ?? undefined,
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        sdivphno: initial?.sdivphno ?? "",
        sdivmob: initial?.sdivmob ?? "",
        sdivcompphno: initial?.sdivcompphno ?? "",
        description: initial?.description ?? "",
      });

      // If editing and circle is prefilled, preload divisions
      if (initial?.circle_id) {
        setLoadingDivs(true);
        getRelatedByCircle(initial.circle_id)
          .then((res) => setDivisions(res?.lists?.divisions ?? []))
          .finally(() => setLoadingDivs(false));
      }
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {mode === "create" ? "Add Sub-Division" : "Edit Sub-Division"}
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-500">
                  Name
                </label>
                <FormInput
                  {...register("name")}
                  placeholder="Enter Name"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Circle */}
              <div>
               <Controller
  name="circle_id"
  control={control}
  rules={{ required: "Circle is required" }}
  render={({ field }) => (
    <div>
      <label className="text-xs font-medium text-slate-500">
        Circle
      </label>
      <FormSelect
        {...field}
        value={field.value ?? ""} // ensure controlled value
        onChange={(e) => {
          const val = e.target.value === "" ? undefined : Number(e.target.value);
          field.onChange(val);
        }}
        className="mt-1"
      >
        <option value="">Select circle</option>
        {circleOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </FormSelect>
      {errors.circle_id && (
        <p className="text-xs text-red-500 mt-1">
          {errors.circle_id.message}
        </p>
      )}
    </div>
  )}
/>
              </div>

              {/* Division (depends on Circle) */}
              <div>
               <Controller
  name="division_id"
  control={control}
  rules={{ required: "Division is required" }}
  render={({ field }) => (
    <div>
      <label className="text-xs font-medium text-slate-500">
        Division {loadingDivs && "(Loading...)"}
      </label>
      <FormSelect
        {...field}
        value={field.value ?? ""} // ensure it's controlled
        onChange={(e) => {
          const val = e.target.value === "" ? undefined : Number(e.target.value);
          field.onChange(val);
        }}
        className="mt-1"
        disabled={!circleId || loadingDivs}
      >
        <option value="">
          {circleId ? "Select division" : "Select circle first"}
        </option>
        {divisions.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </FormSelect>
      {errors.division_id && (
        <p className="text-xs text-red-500 mt-1">
          {errors.division_id.message}
        </p>
      )}
    </div>
  )}
/>
              </div>

              {/* Other Fields */}
              {[ 
                { key: "code", label: "Code", placeholder: "SD001" },
                { key: "sdivphno", label: "Phone", placeholder: "067-1234567" },
                { key: "sdivmob", label: "Mobile", placeholder: "+923001234567" },
                { key: "sdivcompphno", label: "Complaint Phone", placeholder: "067-7654321" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-500">
                    {f.label}
                  </label>
                  <FormInput
                    {...register(f.key as keyof SubDivisionFormValues)}
                    placeholder={f.placeholder}
                    className="mt-1"
                  />
                  {errors[f.key as keyof SubDivisionFormValues] && (
                    <p className="text-xs text-red-500 mt-1">
                      {
                        errors[f.key as keyof SubDivisionFormValues]
                          ?.message as string
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-slate-500">
                Description
              </label>
              <textarea
                {...(register("description") as any)}
                rows={3}
                placeholder="Description (optional)"
                className="mt-1 block w-full rounded-md border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 text-sm p-3"
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={onClose}
              >
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
export function SubDivisionViewDialog({
  open,
  subDivision,
  onClose,
}: {
  open: boolean;
  subDivision?: SubDivision | null;
  onClose: () => void;
}) {
  if (!subDivision) return null;
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Sub-Division Details</div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Code:</span> {subDivision.code}
            </div>
            <div>
              <span className="font-medium">Name:</span> {subDivision.name}
            </div>
            <div>
              <span className="font-medium">Division ID:</span>{" "}
              {subDivision.division_id}
            </div>
            <div>
              <span className="font-medium">Circle ID:</span>{" "}
              {subDivision.circle_id}
            </div>
            <div>
              <span className="font-medium">Phone:</span>{" "}
              {subDivision.sdivphno || "—"}
            </div>
            <div>
              <span className="font-medium">Mobile:</span>{" "}
              {subDivision.sdivmob || "—"}
            </div>
            <div>
              <span className="font-medium">Complaint Phone:</span>{" "}
              {subDivision.sdivcompphno || "—"}
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              {subDivision.is_active ? "Active" : "Inactive"}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Description:</span>{" "}
              {subDivision.description || "—"}
            </div>
          </div>
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

// --- DELETE DIALOG ---
export function SubDivisionDeleteDialog({
  open,
  subDivision,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  subDivision?: SubDivision | null;
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
          <div className="text-lg font-medium">Delete Sub-Division?</div>
          <p className="text-slate-600 text-sm">
            This action cannot be undone. This will permanently delete{" "}
            <b>{subDivision?.name}</b>.
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
