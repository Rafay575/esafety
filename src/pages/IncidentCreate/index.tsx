import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import Lucide from "@/components/Base/Lucide";
import { useNavigate, useSearchParams } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */
type IncidentType = "Electrical" | "Mechanical" | "Safety" | "Environmental" | "Other";
type Severity = "Low" | "Medium" | "High" | "Critical";
type LinkedEntityType = "PTW" | "Job" | "PJRA";

/* -------------------------------------------------------------------------- */
/* Options                                                                     */
/* -------------------------------------------------------------------------- */
const TYPE_OPTS: IncidentType[] = ["Electrical", "Mechanical", "Safety", "Environmental", "Other"];
const SEVERITY_OPTS: Severity[] = ["Low", "Medium", "High", "Critical"];
const ENTITY_OPTS: LinkedEntityType[] = ["PTW", "Job", "PJRA"];

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
const IncidentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    occurredAt: "",                // datetime-local
    lat: "",
    lng: "",
    type: "" as "" | IncidentType,
    entityType: "" as "" | LinkedEntityType,
    entityId: "",
    description: "",
    severity: "" as "" | Severity,
    photos: null as FileList | null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Prefill from ?ptw=XXXX (optional)
  useEffect(() => {
    const ptw = params.get("ptw");
    if (ptw) {
      setForm((f) => ({ ...f, entityType: "PTW", entityId: ptw }));
    }
  }, [params]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.occurredAt) e.occurredAt = "Occurred At is required";
    if (!form.type) e.type = "Incident Type is required";
    if (!form.severity) e.severity = "Severity is required";
    if (!form.entityType) e.entityType = "Select what this incident links to (PTW/Job/PJRA)";
    if (!form.entityId.trim()) e.entityId = "Linked ID is required";
    if (!form.description.trim() || form.description.trim().length < 10) {
      e.description = "Description must be at least 10 characters";
    }
    // GPS optional; if one provided then both must be valid numbers
    const hasLat = form.lat.trim() !== "";
    const hasLng = form.lng.trim() !== "";
    if ((hasLat || hasLng) && (Number.isNaN(Number(form.lat)) || Number.isNaN(Number(form.lng)))) {
      e.lat = "Provide valid numeric GPS coordinates (lat/lng)";
      e.lng = "Provide valid numeric GPS coordinates (lat/lng)";
    }
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const onSubmit = async () => {
    if (!isValid) {
      // quick client-side hint
      setConfirmOpen(false);
      alert("Please fix the highlighted errors and try again.");
      return;
    }

    try {
      setSubmitting(true);

      // Build payload (multipart because of photos)
      const fd = new FormData();
      fd.append("occurred_at", new Date(form.occurredAt).toISOString());
      if (form.lat) fd.append("lat", form.lat);
      if (form.lng) fd.append("lng", form.lng);
      fd.append("type", form.type);
      fd.append("linked_entity_type", form.entityType);
      fd.append("linked_entity_id", form.entityId);
      fd.append("description", form.description);
      fd.append("severity", form.severity);
      if (form.photos && form.photos.length) {
        Array.from(form.photos).forEach((file) => fd.append("photos[]", file));
      }

      // TODO: replace with your real endpoint
      // await fetch("/api/incidents", { method: "POST", body: fd });

      // Simulate success
      setTimeout(() => {
        alert("Incident submitted successfully.");
        navigate("/incidents"); // or back to listing
      }, 400);
    } catch (e) {
      console.error(e);
      alert("Failed to submit incident. Please try again.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">Report Incident</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            <Lucide icon="Send" className="w-4 h-4 mr-2" />
            Submit Incident
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="col-span-12 lg:col-span-8 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          {/* Occurred At + Severity */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <label className="form-label required">Occurred At</label>
              <FormInput
                type="datetime-local"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
              />
              {errors.occurredAt && (
                <div className="text-rose-600 text-xs mt-1">{errors.occurredAt}</div>
              )}
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="form-label required">Severity</label>
              <FormSelect
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Severity }))}
              >
                <option value="">Select severity</option>
                {SEVERITY_OPTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </FormSelect>
              {errors.severity && (
                <div className="text-rose-600 text-xs mt-1">{errors.severity}</div>
              )}
            </div>
          </div>

          {/* GPS */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-12 md:col-span-6">
              <label className="form-label">GPS Latitude</label>
              <FormInput
                placeholder="e.g. 31.5204"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              />
              {errors.lat && <div className="text-rose-600 text-xs mt-1">{errors.lat}</div>}
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="form-label">GPS Longitude</label>
              <FormInput
                placeholder="e.g. 74.3587"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              />
              {errors.lng && <div className="text-rose-600 text-xs mt-1">{errors.lng}</div>}
            </div>
          </div>

          {/* Type */}
          <div className="mt-4">
            <label className="form-label required">Incident Type</label>
            <FormSelect
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as IncidentType }))}
            >
              <option value="">Select type</option>
              {TYPE_OPTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </FormSelect>
            {errors.type && <div className="text-rose-600 text-xs mt-1">{errors.type}</div>}
          </div>

          {/* Linked entity */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-12 md:col-span-4">
              <label className="form-label required">Linked To</label>
              <FormSelect
                value={form.entityType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entityType: e.target.value as LinkedEntityType }))
                }
              >
                <option value="">Select entity</option>
                {ENTITY_OPTS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </FormSelect>
              {errors.entityType && (
                <div className="text-rose-600 text-xs mt-1">{errors.entityType}</div>
              )}
            </div>
            <div className="col-span-12 md:col-span-8">
              <label className="form-label required">
                {form.entityType ? `${form.entityType} ID` : "Linked ID"}
              </label>
              <FormInput
                placeholder={form.entityType ? `Enter ${form.entityType} reference` : "e.g. PTW-25-0129"}
                value={form.entityId}
                onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
              />
              {errors.entityId && (
                <div className="text-rose-600 text-xs mt-1">{errors.entityId}</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="form-label required">Description</label>
            <FormTextarea
              rows={6}
              placeholder="Describe what happened, which personnel/equipment were involved, immediate actions taken, etc."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            {errors.description && (
              <div className="text-rose-600 text-xs mt-1">{errors.description}</div>
            )}
          </div>

          {/* Photos */}
          <div className="mt-4">
            <label className="form-label">Photos</label>
            <FormInput
              type="file"
              multiple
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, photos: e.target.files || null }))
              }
            />
            <div className="text-xs text-slate-500 mt-1">
              You can attach multiple images as evidence.
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setConfirmOpen(true)} disabled={submitting}>
              <Lucide icon="Send" className="w-4 h-4 mr-2" />
              Submit Incident
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar (optional helpers) */}
      <div className="col-span-12 lg:col-span-4 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="text-sm font-medium mb-3">Submission Checklist</div>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• Provide accurate date/time of occurrence.</li>
            <li>• Select correct severity and type.</li>
            <li>• Link to the correct PTW/Job/PJRA.</li>
            <li>• Add clear description (≥ 10 characters).</li>
            <li>• Add GPS coordinates if available.</li>
            <li>• Attach photos as evidence (optional but recommended).</li>
          </ul>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={setConfirmOpen}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium">Submit Incident?</div>
            <div className="mt-2 text-xs text-slate-500">
              Please confirm. You can’t edit after submission (you’ll need an update/append flow).
            </div>

            {/* quick errors summary, if any */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700 text-xs">
                <div className="font-medium mb-1">Fix these before submitting:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {Object.values(errors).map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline-secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default IncidentCreatePage;
