import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import Button from "@/components/Base/Button";
import { Dialog } from "@/components/Base/Headless";
import SearchSelect from "@/components/Base/SearchSelect";
import DateSelector from "@/components/Base/Form/DateSelector";
import { FormCheck } from "@/components/Base/Form";

interface CreatePostingModalProps {
  open: boolean;
  userId: number;
  onClose: () => void;
  onCreated: () => void;
}

interface PostingFormValues {
  region_id: number;
  circle_id: number;
  division_id: number;
  sub_division_id: number;
  feeder_id: number;
  grid_id: number;
  effective_from: string;
  effective_to: string;
}

export function CreatePostingModal({
  open,
  userId,
  onClose,
  onCreated,
}: CreatePostingModalProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PostingFormValues>({
    defaultValues: {
      region_id: 0,
      circle_id: 0,
      division_id: 0,
      sub_division_id: 0,
      feeder_id: 0,
      grid_id: 0,
      effective_from: "",
      effective_to: "",
    },
  });

  const [regions, setRegions] = useState<any[]>([]);
  const [grid, setGrid] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [feeders, setFeeders] = useState<any[]>([]);
  
  const [isGridPosting, setIsGridPosting] = useState(false);

  const regionId = watch("region_id");
  const circleId = watch("circle_id");
  const divisionId = watch("division_id");
  const subDivId = watch("sub_division_id");
  const effectiveFrom = watch("effective_from");

  // Get today's date in YYYY-MM-DD format
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Validate effective_to is greater than effective_from
  const validateEffectiveTo = (value: string) => {
    if (!value) return "Effective to is required";

    if (effectiveFrom && value <= effectiveFrom) {
      return "Effective to must be greater than effective from";
    }

    return true;
  };

  // Validate effective_from is today or in the future
  const validateEffectiveFrom = (value: string) => {
    if (!value) return "Effective from is required";

    const today = getToday();
    if (value < today) {
      return "Effective from must be today or a future date";
    }

    return true;
  };

  const validateRegion = (value: number) => {
    if (!value || value === 0) {
      return "Region is required";
    }
    return true;
  };

  const validateCircle = (value: number) => {
    if (!value || value === 0) {
      return "Circle is required";
    }
    return true;
  };

  const validateDivision = (value: number) => {
    if (!isGridPosting && (!value || value === 0)) {
      return "Division is required";
    }
    return true;
  };



  const validateGrid = (value: number) => {
    if (isGridPosting && (!value || value === 0)) {
      return "Grid is required";
    }
    return true;
  };

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    
    reset();
    setIsGridPosting(false);
    
    api
      .get("/api/v1/meta/regions", { params: { per_page: "all" } })
      .then((res) => setRegions(res.data.data ?? res.data.rows ?? []));

    api
      .get("/api/v1/meta/grid-stations", { params: { per_page: "all" } })
      .then((res) => setGrid(res.data.data ?? res.data.rows ?? []));
  }, [open]);

  /* ---------------- Cascade Loaders ---------------- */
  useEffect(() => {
    if (!regionId || regionId === 0) {
      setValue("circle_id", 0);
      setCircles([]);
      return;
    }
    
    api
      .get("/api/v1/meta/related", { params: { region_id: regionId } })
      .then((res) => setCircles(res.data.lists.circles ?? []));
  }, [regionId]);

  useEffect(() => {
    if (!circleId || circleId === 0) {
      setValue("division_id", 0);
      setDivisions([]);
      return;
    }
    
    api
      .get("/api/v1/meta/related", { params: { circle_id: circleId } })
      .then((res) => setDivisions(res.data.lists.divisions ?? []));
  }, [circleId]);

  useEffect(() => {
    if (!divisionId || divisionId === 0) {
      setValue("sub_division_id", 0);
      setSubs([]);
      return;
    }
    
    api
      .get("/api/v1/meta/related", { params: { division_id: divisionId } })
      .then((res) => setSubs(res.data.lists.sub_divisions ?? []));
  }, [divisionId]);

  useEffect(() => {
    if (!subDivId || subDivId === 0) {
      setValue("feeder_id", 0);
      setFeeders([]);
      return;
    }
    
    api
      .get("/api/v1/meta/related", { params: { sub_division_id: subDivId } })
      .then((res) => setFeeders(res.data.lists.feeders ?? []));
  }, [subDivId]);

  /* ---------------- Submit Handler ---------------- */
  const onSubmit = async (values: PostingFormValues) => {
    try {
      // Final validation before submission
      const today = getToday();
      if (values.effective_from < today) {
        toast.error("Effective from must be today or a future date");
        return;
      }

      if (values.effective_to && values.effective_to <= values.effective_from) {
        toast.error("Effective to must be greater than effective from");
        return;
      }

      // Prepare payload based on posting type
      const payload = {
        user_id: userId,
        effective_from: values.effective_from,
        effective_to: values.effective_to,
        region_id: values.region_id,
        circle_id: values.circle_id,
        posting_type: isGridPosting ? "grid" : "non-grid"
      };

      if (isGridPosting) {
        // Grid posting: include grid_id, exclude others
        Object.assign(payload, {
          grid_id: values.grid_id,
          division_id: null,
          sub_division_id: null,
          feeder_id: null
        });
      } else {
        // Non-grid posting: include division and sub-division
        Object.assign(payload, {
          division_id: values.division_id,
          sub_division_id: values.sub_division_id,
          feeder_id: values.feeder_id || null,
          grid_id: null
        });
      }

      await api.post("/api/v1/meta/user-postings", payload);

      toast.success("Posting created successfully!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error("Failed to create posting");
    }
  };

  // Handle checkbox change
  const handleGridCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsGridPosting(checked);
    
    // Reset dependent fields when toggling
    if (checked) {
      // Switching to grid posting - clear division/sub-division/feeder
      setValue("division_id", 0);
      setValue("sub_division_id", 0);
      setValue("feeder_id", 0);
      setDivisions([]);
      setSubs([]);
      setFeeders([]);
    } else {
      // Switching to non-grid posting - clear grid
      setValue("grid_id", 0);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel className="min-w-[60%]">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create New Posting</h2>

          {/* Grid Checkbox */}
          <div className="mb-4">
            <FormCheck>
              <FormCheck.Input
                type="checkbox"
                name="posting_type"
                id="posting_type"
                checked={isGridPosting}
                onChange={handleGridCheckboxChange}
              />
              <FormCheck.Label htmlFor="posting_type">
                Grid Posting
              </FormCheck.Label>
            </FormCheck>
            <p className="text-sm text-gray-500 mt-1">
              {isGridPosting 
                ? "Only Region, Circle, and Grid fields are required" 
                : "Region, Circle, Division, and Sub Division fields are required"}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Region - Always Required */}
            <div>
              <label
                className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="region_id"
              >
                Regions *
              </label>
              <Controller
                name="region_id"
                control={control}
                rules={{
                  required: "Region is required",
                  validate: validateRegion
                }}
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <SearchSelect
                      {...field}
                      className="w-full !mt-1"
                      placeholder="Select Region"
                      options={regions.map((r) => ({
                        value: r.id,
                        label: r.code + " - " + r.name,
                      }))}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">
                        {error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Circle - Always Required */}
            <div>
              <label
                htmlFor="circle_id"
                className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Circle *
              </label>
              <Controller
                name="circle_id"
                control={control}
                rules={{
                  required: "Circle is required",
                  validate: validateCircle
                }}
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <SearchSelect
                      {...field}
                      className="w-full !mt-1"
                      placeholder="Select Circle"
                      options={circles.map((c) => ({
                        value: c.id,
                        label: c.code + " - " + c.name,
                      }))}
                      disabled={!regionId || regionId === 0}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">
                        {error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Grid - Only for Grid Posting */}
            {isGridPosting && (
              <div>
                <label
                  htmlFor="grid_id"
                  className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Grid *
                </label>
                <Controller
                  name="grid_id"
                  control={control}
                  rules={{
                    required: "Grid is required",
                    validate: validateGrid
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <div>
                      <SearchSelect
                        {...field}
                        className="w-full !mt-0"
                        placeholder="Select Grid"
                        options={grid.map((g) => ({
                          value: g.id,
                          label: g.code + " - " + g.name,
                        }))}
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">
                          {error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Division - Only for Non-Grid Posting */}
            {!isGridPosting && (
              <>
                <div>
                  <label
                    htmlFor="division_id"
                    className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Division *
                  </label>
                  <Controller
                    name="division_id"
                    control={control}
                    rules={{
                      required: "Division is required",
                      validate: validateDivision
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <div>
                        <SearchSelect
                          {...field}
                          className="w-full !mt-1"
                          placeholder="Select Division"
                          options={divisions.map((d) => ({
                            value: d.id,
                            label: d.code + " - " + d.name,
                          }))}
                          disabled={!circleId || circleId === 0}
                        />
                        {error && (
                          <p className="mt-1 text-sm text-red-600">
                            {error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Sub Division - Only for Non-Grid Posting */}
                <div>
                  <label
                    htmlFor="sub_division_id"
                    className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Sub Division *
                  </label>
                  <Controller
                    name="sub_division_id"
                    control={control}
                
                    render={({ field, fieldState: { error } }) => (
                      <div>
                        <SearchSelect
                          {...field}
                          className="w-full !mt-1"
                          placeholder="Select Sub Division"
                          options={subs.map((s) => ({
                            value: s.id,
                            label: s.code + " - " + s.name,
                          }))}
                          disabled={!divisionId || divisionId === 0}
                        />
                        {error && (
                          <p className="mt-1 text-sm text-red-600">
                            {error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Feeder - Optional for Non-Grid Posting */}
                <div>
                  <label
                    htmlFor="feeder_id"
                    className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Feeder
                  </label>
                  <Controller
                    name="feeder_id"
                    control={control}
                    render={({ field }) => (
                      <SearchSelect
                        {...field}
                        className="w-full !mt-0"
                        placeholder="Select Feeder"
                        options={feeders.map((f) => ({
                          value: f.id,
                          label: f.code + " - " + f.name,
                        }))}
                        disabled={!subDivId || subDivId === 0}
                      />
                    )}
                  />
                </div>
              </>
            )}

            {/* DATES - Always Required */}
            <div className="grid grid-cols-2 col-span-3 gap-4">
              <div>
                <Controller
                  name="effective_from"
                  control={control}
                  rules={{
                    required: "Effective from is required",
                    validate: validateEffectiveFrom,
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <div>
                      <DateSelector
                        label="Effective From *"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(d) =>
                          field.onChange(d?.toISOString().split("T")[0])
                        }
                        placeholder="Effective From"
                        minDate={new Date()}
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">
                          {error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div>
                <Controller
                  name="effective_to"
                  control={control}
                  rules={{
                    required: "Effective to is required",
                    validate: validateEffectiveTo,
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <div>
                      <DateSelector
                        label="Effective To *"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(d) =>
                          field.onChange(d?.toISOString().split("T")[0])
                        }
                        placeholder="Effective To"
                        minDate={
                          effectiveFrom
                            ? new Date(
                                new Date(effectiveFrom).getTime() + 86400000,
                              )
                            : new Date()
                        }
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">
                          {error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 !mt-6 col-span-3">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Posting
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}