"use client";

import { Dialog } from "@/components/Base/Headless";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import SearchSelect from "@/components/Base/SearchSelect";
import DateSelector from "@/components/Base/Form/DateSelector";
import Button from "@/components/Base/Button";
import { toast } from "sonner";

interface CreatePostingModalProps {
  open: boolean;
  userId: number;     // ⬅️ Required
  onClose: () => void;
  onCreated: () => void; // refresh list
}

interface PostingFormValues {
  region_id: number;
  circle_id: number;
  division_id: number;
  sub_division_id: number;
  feeder_id: number;
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
    setValue
  } = useForm<PostingFormValues>({
    defaultValues: {
      region_id: 0,
      circle_id: 0,
      division_id: 0,
      sub_division_id: 0,
      feeder_id: 0,
      effective_from: "",
      effective_to: "",
    },
  });

  const [regions, setRegions] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [feeders, setFeeders] = useState<any[]>([]);

  const regionId = watch("region_id");
  const circleId = watch("circle_id");
  const divisionId = watch("division_id");
  const subDivId = watch("sub_division_id");

  /* ---------------- Load Regions on Open ---------------- */
  useEffect(() => {
    if (!open) return;

    reset(); // clear all values when opening fresh modal

    api
      .get("/api/v1/meta/regions", { params: { per_page: "all" } })
      .then((res) => setRegions(res.data.data ?? res.data.rows ?? []));
  }, [open]);

  /* ---------------- Cascade Loaders ---------------- */
  useEffect(() => {
    if (!regionId) return;

    api
      .get("/api/v1/meta/related", { params: { region_id: regionId } })
      .then((res) => setCircles(res.data.lists.circles ?? []));
  }, [regionId]);

  useEffect(() => {
    if (!circleId) return;

    api
      .get("/api/v1/meta/related", { params: { circle_id: circleId } })
      .then((res) => setDivisions(res.data.lists.divisions ?? []));
  }, [circleId]);

  useEffect(() => {
    if (!divisionId) return;

    api
      .get("/api/v1/meta/related", { params: { division_id: divisionId } })
      .then((res) => setSubs(res.data.lists.sub_divisions ?? []));
  }, [divisionId]);

  useEffect(() => {
    if (!subDivId) return;

    api
      .get("/api/v1/meta/related", { params: { sub_division_id: subDivId } })
      .then((res) => setFeeders(res.data.lists.feeders ?? []));
  }, [subDivId]);

  /* ---------------- Submit Handler ---------------- */
  const onSubmit = async (values: PostingFormValues) => {
    try {
      await api.post("/api/v1/meta/user-postings", {
        user_id: userId,
        ...values,
      });

      toast.success("Posting created successfully!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error("Failed to create posting");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel className="max-w-xl">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create New Posting</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* REGION */}
            <Controller
              name="region_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  placeholder="Select Region"
                  options={regions.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              )}
            />

            {/* CIRCLE */}
            <Controller
              name="circle_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  placeholder="Select Circle"
                  options={circles.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
              )}
            />

            {/* DIVISION */}
            <Controller
              name="division_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  placeholder="Select Division"
                  options={divisions.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                />
              )}
            />

            {/* SUB DIVISION */}
            <Controller
              name="sub_division_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  placeholder="Select Sub Division"
                  options={subs.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                />
              )}
            />

            {/* FEEDER */}
            <Controller
              name="feeder_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  {...field}
                  placeholder="Select Feeder"
                  options={feeders.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                />
              )}
            />

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="effective_from"
                control={control}
                render={({ field }) => (
                  <DateSelector
                    value={field.value ? new Date(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d?.toISOString().split("T")[0])
                    }
                    placeholder="Effective From"
                  />
                )}
              />

              <Controller
                name="effective_to"
                control={control}
                render={({ field }) => (
                  <DateSelector
                    value={field.value ? new Date(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d?.toISOString().split("T")[0])
                    }
                    placeholder="Effective To"
                  />
                )}
              />
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline-secondary" onClick={onClose}>
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
