// src/pages/PtwCreate.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import {
  ORGS, ASSET_TYPES, HAZARDS, CONTROLS, USERS, CATEGORIES,
  Asset, FormState, uid, todayIso, computeRisk,
  hasCrewConflict, addPermit
} from "../data";

const PtwCreate: React.FC = () => {
  const navigate = useNavigate();

  // --- Form state (single page) ---
  const [form, setForm] = useState<FormState>({
    enterprise: false,
    asset: {},
    hazards: [],
    switchPlans: [],
    crewMembers: [],
    skillTags: [],
    evidence: { photos: [], ts: todayIso() },
    status: "draft",
  });

  // --- Validation ---
  const [errors, setErrors] = useState<Record<string, string>>({});

  // helpers
  const setAsset = (patch: Partial<Asset>) =>
    setForm((f) => ({ ...f, asset: { ...f.asset, ...patch } }));

  // derived
  const risk = computeRisk(form.likelihood, form.severity);
  const leadName = USERS.find((u) => u.id === form.crewLead)?.name;
  const memberNames = form.crewMembers
    .map((id) => USERS.find((u) => u.id === id)?.name || "")
    .filter(Boolean);

  const conflict = useMemo(() => {
    const crew = [leadName, ...memberNames].filter(Boolean) as string[];
    return hasCrewConflict(crew, form.windowStart, form.windowEnd);
  }, [leadName, memberNames, form.windowStart, form.windowEnd]);

  // validate
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title?.trim()) e.title = "Title is required";
    if (!form.category) e.category = "Category is required";

    if (!form.windowStart) e.windowStart = "Start time is required";
    if (!form.windowEnd) e.windowEnd = "End time is required";
    if (form.windowStart && form.windowEnd && new Date(form.windowEnd) < new Date(form.windowStart)) {
      e.windowEnd = "End must be after Start";
    }

    if (!form.asset.region) e.region = "Region is required";
    if (!form.asset.assetType) e.assetType = "Asset Type is required";

    if (!form.crewLead) e.crewLead = "Crew Lead is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // actions
  const saveDraft = () => {
    setForm((f) => ({ ...f, status: "draft" }));
    alert("Draft saved (client-only).");
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    if (conflict) {
      alert("❌ Conflict: selected crew overlaps an active PTW in the time window.");
      return;
    }
    const id = "PTW-" + uid();
    const regionName = ORGS.find((o) => o.id === form.asset.region)?.name || "-";
    addPermit({
      id,
      title: form.title || "Untitled PTW",
      region: regionName,
      lead: leadName || "-",
      members: memberNames,
      status: "submitted",
      windowStart: form.windowStart || todayIso(),
      windowEnd: form.windowEnd || todayIso(),
    });
    alert("Submitted (dummy) → listing updated");
    navigate("/ptw");
  };

  const resetForm = () => {
    setForm({
      enterprise: false,
      asset: {},
      hazards: [],
      switchPlans: [],
      crewMembers: [],
      skillTags: [],
      evidence: { photos: [], ts: todayIso() },
      status: "draft",
    });
    setErrors({});
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">Create PTW</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Enterprise Mode with FormCheck */}
          <FormCheck className="mr-2">
            <FormCheck.Input
              id="enterprise-mode"
              type="checkbox"
              checked={form.enterprise}
              onChange={(e) => setForm((f) => ({ ...f, enterprise: e.target.checked }))}
            />
            <FormCheck.Label htmlFor="enterprise-mode" className="text-sm">
              Enterprise Mode
            </FormCheck.Label>
          </FormCheck>

          <span className={`px-3 py-1 rounded text-xs ${form.status === "draft" ? "bg-slate-100" : "bg-emerald-100"} text-slate-700`}>
            Status: {form.status}
          </span>
          <Button variant="outline-secondary" onClick={resetForm}>Reset</Button>
          <Button variant="primary" onClick={() => submit()}>
            <Lucide icon="Save" className="w-4 h-4 mr-2" /> Submit
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <form
        className="col-span-12 box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600"
        onSubmit={submit}
      >
        <div className="grid grid-cols-12 gap-6">
          {/* PTW Details */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">PTW Details</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-6">
                <span className="text-xs text-slate-500">Title *</span>
                <FormInput
                  value={form.title ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Feeder F-101 Maintenance"
                />
                {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Category *</span>
                <FormSelect
                  value={form.category ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as any }))}
                >
                  <option value="">Select</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </FormSelect>
                {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Risk (computed)</span>
                <div className="px-3 py-2 rounded-md bg-slate-50 dark:bg-darkmode-600 text-sm">
                  <span className={risk >= 15 ? "text-rose-600" : risk >= 8 ? "text-amber-600" : "text-emerald-600"}>{risk}</span>
                </div>
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Window Start *</span>
                <FormInput
                  type="datetime-local"
                  value={form.windowStart ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, windowStart: e.target.value }))}
                />
                {errors.windowStart && <p className="text-rose-500 text-xs mt-1">{errors.windowStart}</p>}
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Window End *</span>
                <FormInput
                  type="datetime-local"
                  value={form.windowEnd ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, windowEnd: e.target.value }))}
                />
                {errors.windowEnd && <p className="text-rose-500 text-xs mt-1">{errors.windowEnd}</p>}
              </label>

              <label className="col-span-12">
                <span className="text-xs text-slate-500">Description</span>
                <textarea
                  rows={3}
                  placeholder="Short description of the activity..."
                  className="w-full !box rounded-md p-3 text-sm"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
          </div>

          {/* Org / Asset */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Org / Asset</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Region *</span>
                <FormSelect
                  value={form.asset.region ?? ""}
                  onChange={(e) =>
                    setAsset({ region: Number(e.target.value) || undefined, division: undefined, feeder: undefined })
                  }
                >
                  <option value="">Select</option>
                  {ORGS.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </FormSelect>
                {errors.region && <p className="text-rose-500 text-xs mt-1">{errors.region}</p>}
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Division</span>
                <FormSelect
                  value={form.asset.division ?? ""}
                  onChange={(e) => setAsset({ division: e.target.value || undefined })}
                  disabled={!form.asset.region}
                >
                  <option value="">Select</option>
                  {ORGS.find((o) => o.id === form.asset.region)?.divisions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </FormSelect>
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Feeder</span>
                <FormSelect
                  value={form.asset.feeder ?? ""}
                  onChange={(e) => setAsset({ feeder: e.target.value || undefined })}
                  disabled={!form.asset.region}
                >
                  <option value="">Select</option>
                  {ORGS.find((o) => o.id === form.asset.region)?.feeders.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </FormSelect>
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Asset Type *</span>
                <FormSelect
                  value={form.asset.assetType ?? ""}
                  onChange={(e) => setAsset({ assetType: e.target.value as any })}
                >
                  <option value="">Select</option>
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </FormSelect>
                {errors.assetType && <p className="text-rose-500 text-xs mt-1">{errors.assetType}</p>}
              </label>

              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Asset ID</span>
                <FormInput
                  value={form.asset.assetId ?? ""}
                  onChange={(e) => setAsset({ assetId: e.target.value })}
                  placeholder="e.g., T-55"
                />
              </label>

              <label className="col-span-6 md:col-span-3">
                <span className="text-xs text-slate-500">GPS Lat</span>
                <FormInput
                  value={form.asset.gps?.lat ?? ""}
                  onChange={(e) => setAsset({ gps: { ...form.asset.gps, lat: e.target.value } })}
                />
              </label>
              <label className="col-span-6 md:col-span-3">
                <span className="text-xs text-slate-500">GPS Lng</span>
                <FormInput
                  value={form.asset.gps?.lng ?? ""}
                  onChange={(e) => setAsset({ gps: { ...form.asset.gps, lng: e.target.value } })}
                />
              </label>
            </div>
          </div>

          {/* Hazards & Controls (FormCheck) */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Hazards & Controls</div>
            <div className="grid grid-cols-12 gap-4">
              {/* Hazards selection */}
              <div className="col-span-12">
                <div className="flex flex-wrap gap-3">
                  {HAZARDS.map((h) => {
                    const checked = form.hazards.some((x) => x.hazardId === h.id);
                    const id = `haz-${h.id}`;
                    return (
                      <div key={h.id} className="px-3 py-1.5 border rounded-full">
                        <FormCheck className="!mt-0">
                          <FormCheck.Input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setForm((f) => {
                                const exists = f.hazards.some((x) => x.hazardId === h.id);
                                return exists
                                  ? { ...f, hazards: f.hazards.filter((x) => x.hazardId !== h.id) }
                                  : { ...f, hazards: [...f.hazards, { hazardId: h.id, controlIds: [], additional: "" }] };
                              })
                            }
                          />
                          <FormCheck.Label htmlFor={id}>{h.name}</FormCheck.Label>
                        </FormCheck>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-hazard controls */}
              {form.hazards.map((hsel) => {
                const hName = HAZARDS.find((h) => h.id === hsel.hazardId)?.name;
                return (
                  <div key={hsel.hazardId} className="col-span-12 box p-4 rounded-xl">
                    <div className="font-medium mb-2">{hName}</div>

                    <div className="flex flex-wrap gap-3 mb-3">
                      {CONTROLS.map((c) => {
                        const id = `ctrl-${hsel.hazardId}-${c.id}`;
                        const isOn = hsel.controlIds.includes(c.id);
                        return (
                          <div key={c.id} className="px-2 py-1 border rounded">
                            <FormCheck className="!mt-0">
                              <FormCheck.Input
                                id={id}
                                type="checkbox"
                                checked={isOn}
                                onChange={() =>
                                  setForm((f) => ({
                                    ...f,
                                    hazards: f.hazards.map((x) =>
                                      x.hazardId === hsel.hazardId
                                        ? {
                                            ...x,
                                            controlIds: isOn
                                              ? x.controlIds.filter((cid) => cid !== c.id)
                                              : [...x.controlIds, c.id],
                                          }
                                        : x
                                    ),
                                  }))
                                }
                              />
                              <FormCheck.Label htmlFor={id}>{c.name}</FormCheck.Label>
                            </FormCheck>
                          </div>
                        );
                      })}
                    </div>

                    <textarea
                      className="w-full !box rounded-md p-3 text-sm"
                      placeholder="Additional controls/notes..."
                      value={hsel.additional ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          hazards: f.hazards.map((x) =>
                            x.hazardId === hsel.hazardId ? { ...x, additional: e.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Risk Assessment</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Likelihood (1–5)</span>
                <FormInput
                  type="number"
                  min={1}
                  max={5}
                  value={form.likelihood ?? 1}
                  onChange={(e) => setForm((f) => ({ ...f, likelihood: Number(e.target.value || 1) }))}
                />
              </label>
              <label className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Severity (1–5)</span>
                <FormInput
                  type="number"
                  min={1}
                  max={5}
                  value={form.severity ?? 1}
                  onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value || 1) }))}
                />
              </label>
              <div className="col-span-12 md:col-span-3">
                <span className="text-xs text-slate-500">Computed Risk</span>
                <div className="px-3 py-2 rounded-md bg-slate-50 dark:bg-darkmode-600 text-sm">
                  <span className={risk >= 15 ? "text-rose-600" : risk >= 8 ? "text-amber-600" : "text-emerald-600"}>{risk}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Allocation */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Team Allocation</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Crew Lead *</span>
                <FormSelect
                  value={form.crewLead ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, crewLead: Number(e.target.value) || undefined }))}
                >
                  <option value="">Select</option>
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </FormSelect>
                {errors.crewLead && <p className="text-rose-500 text-xs mt-1">{errors.crewLead}</p>}
              </label>

              <div className="col-span-12 md:col-span-8">
                <span className="text-xs text-slate-500">Members</span>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
                  {USERS.map((u) => {
                    const id = `crew-member-${u.id}`;
                    return (
                      <FormCheck key={u.id} className="mt-2">
                        <FormCheck.Input
                          id={id}
                          type="checkbox"
                          checked={form.crewMembers.includes(u.id)}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              crewMembers: e.target.checked
                                ? [...f.crewMembers, u.id]
                                : f.crewMembers.filter((x) => x !== u.id),
                            }))
                          }
                          disabled={u.id === form.crewLead}
                        />
                        <FormCheck.Label htmlFor={id}>{u.name}</FormCheck.Label>
                      </FormCheck>
                    );
                  })}
                </div>
              </div>

              {conflict && (
                <div className="col-span-12 p-3 rounded-md bg-amber-50 text-amber-700 flex items-center gap-2">
                  <Lucide icon="AlertTriangle" className="w-4 h-4" /> Conflict: a selected crew member is already on an active PTW in this time window.
                </div>
              )}

              <label className="col-span-12">
                <span className="text-xs text-slate-500">Skill Tags</span>
                <FormInput
                  value={form.skillTags.join(",")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      skillTags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="comma,separated,tags"
                />
              </label>
            </div>
          </div>

          {/* Evidence & Signature (simple) */}
          <div className="col-span-12">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Evidence & Signature</div>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12">
                <span className="text-xs text-slate-500">Photo URLs (comma separated)</span>
                <textarea
                  rows={2}
                  className="w-full !box rounded-md p-3 text-sm"
                  placeholder="https://... , https://..."
                  value={form.evidence.photos.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      evidence: { ...f.evidence, photos: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) },
                    }))
                  }
                />
              </label>

              <label className="col-span-12 md:col-span-4">
                <span className="text-xs text-slate-500">Evidence Timestamp</span>
                <FormInput
                  type="datetime-local"
                  value={form.evidence.ts ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, evidence: { ...f.evidence, ts: e.target.value } }))}
                />
              </label>

              <label className="col-span-6 md:col-span-4">
                <span className="text-xs text-slate-500">LS Signature Type</span>
                <FormSelect
                  value={form.lsSignature?.type ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, lsSignature: { type: e.target.value as any, value: "" } }))}
                >
                  <option value="">Select</option>
                  <option value="draw">Draw</option>
                  <option value="pin">PIN</option>
                </FormSelect>
              </label>

              <label className="col-span-6 md:col-span-4">
                <span className="text-xs text-slate-500">
                  {form.lsSignature?.type === "pin" ? "PIN (4 digits)" : "Signature (text stub)"}
                </span>
                <FormInput
                  value={form.lsSignature?.value ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      lsSignature: { ...(f.lsSignature || { type: "draw" }), value: e.target.value },
                    }))
                  }
                  placeholder={form.lsSignature?.type === "pin" ? "1234" : "signed by LS (dummy)"}
                />
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="col-span-12 flex items-center justify-end gap-2 pt-2">
            <Button variant="outline-secondary" type="button" onClick={() => navigate(-1)}>
              <Lucide icon="X" className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button variant="outline-secondary" type="button" onClick={saveDraft}>
              <Lucide icon="Save" className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button variant="primary" type="submit" disabled={conflict}>
              <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Submit
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PtwCreate;
