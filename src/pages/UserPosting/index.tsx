"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Button from "@/components/Base/Button";
import SearchSelect from "@/components/Base/SearchSelect";
import DateSelector from "@/components/Base/Form/DateSelector";
import { toast } from "sonner";
import { api } from "@/lib/axios";

export default function PostingForm() {
  /* --------------------------
        FORM SETUP
  --------------------------- */
  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      user_id: "",
      region_id: "",
      circle_id: "",
      division_id: "",
      sub_division_id: "",
      feeder_id: "",
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

  /* --------------------------
        WATCHED VALUES
  --------------------------- */
  const userId = Number(watch("user_id") || 0);
  const regionId = Number(watch("region_id") || 0);
  const circleId = Number(watch("circle_id") || 0);
  const divisionId = Number(watch("division_id") || 0);
  const subDivId = Number(watch("sub_division_id") || 0);

  /* --------------------------
        FETCH USERS
  --------------------------- */
  useEffect(() => {
    api
      .get("/api/v1/users", { params: { per_page: "all",exclude_posted: 1  } })
      .then((res) => {
        const rows = res.data?.rows || res.data?.data || [];
        setUsers(
          rows.map((u: any) => ({
            value: u.id,
            label: `${u.name} (${u.id})`,
          }))
        );
      });
  }, []);

  /* --------------------------
        FETCH REGIONS
  --------------------------- */
  useEffect(() => {
    api
      .get("/api/v1/meta/regions", { params: { per_page: "all" } })
      .then((res) => {
        const list = res.data?.data ?? res.data?.rows ?? [];
        setRegions(list);
      })
      .catch(() => setRegions([]));
  }, []);

  /* --------------------------
        REGION → CIRCLE
  --------------------------- */
  useEffect(() => {
    if (!regionId) {
      setCircles([]);
      setDivisions([]);
      setSubDivisions([]);
      setFeeders([]);
      return;
    }

    api
      .get("/api/v1/meta/related", { params: { region_id: regionId } })
      .then((res) => {
        setCircles(res.data?.lists?.circles ?? []);
        setDivisions([]);
        setSubDivisions([]);
        setFeeders([]);
        setValue("circle_id", "");
        setValue("division_id", "");
        setValue("sub_division_id", "");
        setValue("feeder_id", "");
      });
  }, [regionId]);

  /* --------------------------
        CIRCLE → DIVISION
  --------------------------- */
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
        setValue("division_id", "");
        setValue("sub_division_id", "");
        setValue("feeder_id", "");
      });
  }, [circleId]);

  /* --------------------------
        DIVISION → SUBDIVISION
  --------------------------- */
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
        setValue("sub_division_id", "");
        setValue("feeder_id", "");
      });
  }, [divisionId]);

  /* --------------------------
        SUBDIV → FEEDERS
  --------------------------- */
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
          SUBMIT
  --------------------------- */
  const onSubmit = (data: any) => {
    api
      .post("/api/v1/meta/user-postings", data)
      .then(() => toast.success("Posting saved successfully"))
      .catch(() => toast.error("Failed to save posting"));
  };

  /* ------------------------------
         BEAUTIFUL UI STARTS
  ------------------------------- */
  return (
    <div className=" m-5">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border p-8 intro-y space-y-8">

        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-800">Assign User Posting</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select region hierarchy & assign a user to a specific feeder.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* User Field */}
          <div>
            <label className="text-xs font-medium text-slate-500">User</label>
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  options={users}
                  placeholder="Select User"
                />
              )}
            />
          </div>

          {/* 3 Column Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <label className="text-xs font-medium text-slate-500">Region</label>
              <Controller
                name="region_id"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    {...field}
                    options={regions.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                    placeholder="Select Region"
                  />
                )}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Circle</label>
              <Controller
                name="circle_id"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    {...field}
                    disabled={!regionId}
                    options={circles.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    placeholder="Select Circle"
                  />
                )}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Division</label>
              <Controller
                name="division_id"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    {...field}
                    disabled={!circleId}
                    options={divisions.map((d) => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    placeholder="Select Division"
                  />
                )}
              />
            </div>
          </div>

          {/* Subdiv + Feeder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-slate-500">Sub-Division</label>
              <Controller
                name="sub_division_id"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    {...field}
                    disabled={!divisionId}
                    options={subDivisions.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                    placeholder="Select Sub Division"
                  />
                )}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Feeder</label>
              <Controller
                name="feeder_id"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    {...field}
                    disabled={!subDivId}
                    options={feeders.map((f) => ({
                      value: f.id,
                      label: f.name,
                    }))}
                    placeholder="Select Feeder"
                  />
                )}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-slate-500">Effective From</label>
              <Controller
                name="effective_from"
                control={control}
                render={({ field }) => (
                  <DateSelector
                    value={field.value ? new Date(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? d.toISOString().slice(0, 10) : "")
                    }
                  />
                )}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Effective To</label>
              <Controller
                name="effective_to"
                control={control}
                render={({ field }) => (
                  <DateSelector
                    value={field.value ? new Date(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? d.toISOString().slice(0, 10) : "")
                    }
                  />
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="primary" className="w-full py-3 text-sm">
            Save Posting
          </Button>
        </form>
      </div>
    </div>
  );
}
