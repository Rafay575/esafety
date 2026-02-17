"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Button from "@/components/Base/Button";
import SearchSelect from "@/components/Base/SearchSelect";
import DateSelector from "@/components/Base/Form/DateSelector";
import { FormCheck } from "@/components/Base/Form";
import { toast } from "sonner";
import { api } from "@/lib/axios";

interface PostingFormValues {
  user_id: string;
  region_id: number;
  circle_id: number;
  division_id: number;
  sub_division_id: number;
  feeder_id: number;
  grid_id: number;
  effective_from: string;
  effective_to: string;
}

export default function PostingForm() {
  /* --------------------------
        FORM SETUP
  --------------------------- */
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PostingFormValues>({
    defaultValues: {
      user_id: "",
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

  /* --------------------------
        DROPDOWN STATE
  --------------------------- */
  const [users, setUsers] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subDivisions, setSubDivisions] = useState<any[]>([]);
  const [feeders, setFeeders] = useState<any[]>([]);
  const [grid, setGrid] = useState<any[]>([]);
  const [isGridPosting, setIsGridPosting] = useState(false);

  /* --------------------------
        WATCHED VALUES
  --------------------------- */
  const userId = Number(watch("user_id") || 0);
  const regionId = Number(watch("region_id") || 0);
  const circleId = Number(watch("circle_id") || 0);
  const divisionId = Number(watch("division_id") || 0);
  const subDivId = Number(watch("sub_division_id") || 0);
  const effectiveFrom = watch("effective_from");

  /* --------------------------
        VALIDATION FUNCTIONS
  --------------------------- */
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

  const validateUser = (value: string) => {
    if (!value || value === "") {
      return "User is required";
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

  /* --------------------------
        FETCH USERS
  --------------------------- */
  useEffect(() => {
    api
      .get("/api/v1/users", { params: { per_page: "all", exclude_posted: 1 } })
      .then((res) => {
        const rows = res.data?.rows || res.data?.data || [];
        setUsers(
          rows.map((u: any) => ({
            value: u.id.toString(),
            label: `${u.name} (${u.id})`,
          }))
        );
      });
  }, []);

  /* --------------------------
        FETCH REGIONS AND GRID
  --------------------------- */
  useEffect(() => {
    // Fetch regions
    api
      .get("/api/v1/meta/regions", { params: { per_page: "all" } })
      .then((res) => {
        const list = res.data?.data ?? res.data?.rows ?? [];
        setRegions(list);
      })
      .catch(() => setRegions([]));

    // Fetch grid stations
    api
      .get("/api/v1/meta/grid-stations", { params: { per_page: "all" } })
      .then((res) => setGrid(res.data.data ?? res.data.rows ?? []));
  }, []);

  /* --------------------------
        CASCADE LOADERS
  --------------------------- */
  useEffect(() => {
    if (!regionId) {
      setCircles([]);
      setDivisions([]);
      setSubDivisions([]);
      setFeeders([]);
      setValue("circle_id", 0);
      setValue("division_id", 0);
      setValue("sub_division_id", 0);
      setValue("feeder_id", 0);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { region_id: regionId } })
      .then((res) => {
        setCircles(res.data?.lists?.circles ?? []);
        setDivisions([]);
        setSubDivisions([]);
        setFeeders([]);
        setValue("circle_id", 0);
        setValue("division_id", 0);
        setValue("sub_division_id", 0);
        setValue("feeder_id", 0);
      });
  }, [regionId]);

  useEffect(() => {
    if (!circleId) {
      setDivisions([]);
      setSubDivisions([]);
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { circle_id: circleId } })
      .then((res) => {
        setDivisions(res.data?.lists?.divisions ?? []);
        setSubDivisions([]);
        setFeeders([]);
        setValue("division_id", 0);
        setValue("sub_division_id", 0);
        setValue("feeder_id", 0);
      });
  }, [circleId]);

  useEffect(() => {
    if (!divisionId) {
      setSubDivisions([]);
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { division_id: divisionId } })
      .then((res) => {
        setSubDivisions(res.data?.lists?.sub_divisions ?? []);
        setFeeders([]);
        setValue("sub_division_id", 0);
        setValue("feeder_id", 0);
      });
  }, [divisionId]);

  useEffect(() => {
    if (!subDivId) {
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { sub_division_id: subDivId } })
      .then((res) => {
        setFeeders(res.data?.lists?.feeders ?? []);
      });
  }, [subDivId]);

  /* --------------------------
        HANDLE GRID CHECKBOX CHANGE
  --------------------------- */
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
      setSubDivisions([]);
      setFeeders([]);
    } else {
      // Switching to non-grid posting - clear grid
      setValue("grid_id", 0);
    }
  };

  /* --------------------------
          SUBMIT HANDLER
  --------------------------- */
  const onSubmit = async (data: PostingFormValues) => {
    try {
      // Final validation before submission
      const today = getToday();
      if (data.effective_from < today) {
        toast.error("Effective from must be today or a future date");
        return;
      }

      if (data.effective_to && data.effective_to <= data.effective_from) {
        toast.error("Effective to must be greater than effective from");
        return;
      }

      // Prepare payload based on posting type
      const payload = {
        user_id: parseInt(data.user_id),
        effective_from: data.effective_from,
        effective_to: data.effective_to,
        region_id: data.region_id,
        circle_id: data.circle_id,
        posting_type: isGridPosting ? "grid" : "non-grid"
      };

      if (isGridPosting) {
        // Grid posting: include grid_id, exclude others
        Object.assign(payload, {
          grid_id: data.grid_id,
          division_id: null,
          sub_division_id: null,
          feeder_id: null
        });
      } else {
        // Non-grid posting: include division and sub-division
        Object.assign(payload, {
          division_id: data.division_id,
          sub_division_id: data.sub_division_id,
          feeder_id: data.feeder_id || null,
          grid_id: null
        });
      }

      await api.post("/api/v1/meta/user-postings", payload);

      toast.success("Posting created successfully!");
      
      // Reset form after successful submission
      reset({
        user_id: "",
        region_id: 0,
        circle_id: 0,
        division_id: 0,
        sub_division_id: 0,
        feeder_id: 0,
        grid_id: 0,
        effective_from: "",
        effective_to: "",
      });
      setIsGridPosting(false);
      setCircles([]);
      setDivisions([]);
      setSubDivisions([]);
      setFeeders([]);
      
    } catch (err) {
      toast.error("Failed to save posting");
    }
  };

  /* ------------------------------
         BEAUTIFUL UI STARTS
  ------------------------------- */
  return (
    <div className="m-5">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border p-8 intro-y space-y-8">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-800">Assign User Posting</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select user and region hierarchy to assign posting.
          </p>
        </div>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* User Field - Always Required */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              User *
            </label>
            <Controller
              name="user_id"
              control={control}
              rules={{
                required: "User is required",
                validate: validateUser
              }}
              render={({ field, fieldState: { error } }) => (
                <div>
                  <SearchSelect
                    {...field}
                    options={users}
                    placeholder="Select User"
                    className={error ? "border-red-500" : ""}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* 3 Column Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Region - Always Required */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Region *
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
                      options={regions.map((r) => ({
                        value: r.id,
                        label: r.code ? `${r.code} - ${r.name}` : r.name,
                      }))}
                      placeholder="Select Region"
                      className={error ? "border-red-500" : ""}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Circle - Always Required */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
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
                      disabled={!regionId}
                      options={circles.map((c) => ({
                        value: c.id,
                        label: c.code ? `${c.code} - ${c.name}` : c.name,
                      }))}
                      placeholder="Select Circle"
                      className={error ? "border-red-500" : ""}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Grid - Only for Grid Posting */}
            {isGridPosting ? (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
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
                        options={grid.map((g) => ({
                          value: g.id,
                          label: g.code ? `${g.code} - ${g.name}` : g.name,
                        }))}
                        placeholder="Select Grid"
                        className={error ? "border-red-500" : ""}
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">{error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            ) : (
              /* Division - Only for Non-Grid Posting */
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
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
                        disabled={!circleId}
                        options={divisions.map((d) => ({
                          value: d.id,
                          label: d.code ? `${d.code} - ${d.name}` : d.name,
                        }))}
                        placeholder="Select Division"
                        className={error ? "border-red-500" : ""}
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">{error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
          </div>

          {/* Subdiv + Feeder - Only for Non-Grid Posting */}
          {!isGridPosting && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sub Division */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Sub-Division *
                </label>
                <Controller
                  name="sub_division_id"
                  control={control}
                
                  render={({ field, fieldState: { error } }) => (
                    <div>
                      <SearchSelect
                        {...field}
                        disabled={!divisionId}
                        options={subDivisions.map((s) => ({
                          value: s.id,
                          label: s.code ? `${s.code} - ${s.name}` : s.name,
                        }))}
                        placeholder="Select Sub Division"
                        className={error ? "border-red-500" : ""}
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">{error.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Feeder - Optional */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Feeder
                </label>
                <Controller
                  name="feeder_id"
                  control={control}
                  render={({ field }) => (
                    <SearchSelect
                      {...field}
                      disabled={!subDivId}
                      options={feeders.map((f) => ({
                        value: f.id,
                        label: f.code ? `${f.code} - ${f.name}` : f.name,
                      }))}
                      placeholder="Select Feeder"
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Dates - Always Required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Effective From *
              </label>
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
                      value={field.value ? new Date(field.value) : null}
                      onChange={(d) =>
                        field.onChange(d ? d.toISOString().slice(0, 10) : "")
                      }
                      minDate={new Date()}
                      className={error ? "border-red-500" : ""}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Effective To *
              </label>
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
                      value={field.value ? new Date(field.value) : null}
                      onChange={(d) =>
                        field.onChange(d ? d.toISOString().slice(0, 10) : "")
                      }
                      minDate={
                        effectiveFrom
                          ? new Date(new Date(effectiveFrom).getTime() + 86400000)
                          : new Date()
                      }
                      className={error ? "border-red-500" : ""}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="primary" className="w-fit py-3 text-sm">
            Save Posting
          </Button>
        </form>
      </div>
    </div>
  );
}