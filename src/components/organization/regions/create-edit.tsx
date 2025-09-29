import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { useNavigate, useParams } from "react-router-dom";
import { regionsApi } from "./api";
import type { Region } from "../types";

export default function RegionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // undefined on create
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(!!isEdit);
  const [form, setForm] = useState<Pick<Region, "name" | "code" | "status" | "notes">>({
    name: "",
    code: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    const run = async () => {
      if (!isEdit || !id) return;
      try {
        const row = await regionsApi.get(id);
        setForm({ name: row.name, code: row.code ?? "", status: row.status, notes: row.notes ?? "" });
      } catch {
        alert("Region not found");
        navigate("/organization/regions");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isEdit, id, navigate]);

  const onSubmit = async () => {
    if (!form.name.trim()) return alert("Name is required.");
    try {
      if (isEdit && id) {
        await regionsApi.update(id, { ...form });
        alert("Region updated.");
      } else {
        await regionsApi.create({
          name: form.name.trim(),
          code: form.code?.trim() || undefined,
          status: form.status,
          notes: form.notes?.trim() || undefined,
        });
        alert("Region created.");
      }
      navigate("/organization/regions");
    } catch {
      alert("Save failed.");
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">
          {isEdit ? "Edit Region" : "Create Region"}
        </h2>
        <div className="ml-auto">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <Lucide icon="ChevronLeft" className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      <div className="col-span-12 intro-y">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading…</div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-6">
                <label className="form-label required">Name</label>
                <FormInput
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Multan Region"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="form-label">Code</label>
                <FormInput
                  value={form.code ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="MLT"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="form-label required">Status</label>
                <FormSelect
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </FormSelect>
              </div>

              <div className="col-span-12">
                <label className="form-label">Notes</label>
                <FormTextarea
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes about this region."
                />
              </div>

              <div className="col-span-12 flex justify-end gap-2">
                <Button variant="outline-secondary" onClick={() => navigate("/organization/regions")}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={onSubmit}>
                  <Lucide icon="Save" className="w-4 h-4 mr-2" />
                  {isEdit ? "Save Changes" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
