"use client";
import React, { useEffect, useState } from "react";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import FormLabel from "@/components/Base/Form/FormLabel";
import Button from "@/components/Base/Button";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import SearchSelect, { SearchSelectItem } from "@/components/SearchSelect";
import PlannedScheduleModal, {
  PlannedScheduleRow,
} from "@/components/PlannedScheduleModal";

type Feeder = { id: number; name: string; code: string };
type Transformer = {
  id: number;
  transformer_id: string;
  transformer_ref_no: string;
};
type TeamMember = { id: number; name: string; avatar_url: string };

type PtwType = "MISC" | "PLANNED" | "EMERGENCY";

export default function PTW_SingleForm_BilingualLabels({
  setId,
  next,
  id,
}: {
  setId: (id: number) => void;
  next: () => void;
  id?: number;
}) {
  const [loading, setLoading] = useState(true);

  const [context, setContext] = useState<{
    sub_division?: { id: number; name: string };
    primary_feeders: Feeder[];
    secondary_feeders: Feeder[];
    team_members: TeamMember[];
  }>({ primary_feeders: [], secondary_feeders: [], team_members: [] });

  const [transformers, setTransformers] = useState<Transformer[]>([]);

  // planned modal
  const [plannedOpen, setPlannedOpen] = useState(false);

  // remember preview names so we can map -> IDs when lists load
  const [previewNames, setPreviewNames] = useState<{
    feederName?: string;
    transformerName?: string;
  }>({});

  const today = new Date().toISOString().split("T")[0];

  // Keep all form fields as strings for inputs/selects, convert on submit
  const [form, setForm] = useState({
    current_date: today,
    type: "MISC" as PtwType,
    misc_type: "",
    circuit_type: "SINGLE" as "SINGLE" | "MULTI",

    sub_division_id: "", // stringified ID
    feeder_id: "", // stringified ID (primary feeder)
    secondary_feeder_ids: [] as number[], // only for MULTI
    is_ptw_required: "YES" as "YES" | "NO",

    // planned fields
    planned_from_date: "",
    planned_to_date: "",
    planned_schedule: [] as PlannedScheduleRow[],

    transformer_id: "", // stringified ID
    feeder_incharge_name: "",
    close_feeder: "",
    alternate_feeder: "",
    location_text: "",
    location_lat: "",
    location_lng: "",
    place_of_work: "",
    scope_of_work: "",
    safety_arrangements: "",
    scheduled_start_at: "", // YYYY-MM-DDTHH:mm
    estimated_duration_min: "", // numeric as string
    switch_off_time: "", // HH:mm
    restore_time: "",
    team_member_ids: [] as number[],
    evidences: [null, null, null] as (File | null)[],
    existing_evidences: [] as { id: number; file_path: string; type: string }[],
  });

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // ---------- Load context + optionally hydrate from preview ----------
  useEffect(() => {
    const init = async () => {
      try {
        const ctxRes = await api.get(`/api/v1/ptw/context`);
        const ctx = ctxRes.data.data;
        const sdId = String(ctx?.sub_division?.id ?? "");

        setContext({
          sub_division: ctx.sub_division,
          primary_feeders: (ctx.primary_feeders ?? []) as Feeder[],
          secondary_feeders: (ctx.secondary_feeders ?? []) as Feeder[],
          team_members: (ctx.team_members ?? []) as TeamMember[],
        });

        setForm((p) => ({ ...p, sub_division_id: sdId }));

        if (id) {
          const { data } = await api.get(`/api/v1/ptw/${id}/preview`);
          const p = data?.data?.ptw;

          setPreviewNames({
            feederName: p?.feeder_name ?? undefined,
            transformerName: p?.transformer_name ?? undefined,
          });

          // NOTE:
          // If your preview endpoint returns planned fields, hydrate here:
          // planned_from_date, planned_to_date, planned_schedule (optional)
          setForm((prev) => ({
            ...prev,
            type: (p?.type as PtwType) || "MISC",
            misc_type: p?.misc_type || "",
            circuit_type:
              (p?.circuit_type as "SINGLE" | "MULTI") || prev.circuit_type,
            is_ptw_required:
              (p?.is_ptw_required as "YES" | "NO") || prev.is_ptw_required,

            feeder_incharge_name: p?.feeder_incharge_name || "",
            close_feeder: p?.close_feeder || "",
            alternate_feeder: p?.alternate_feeder || "",
            place_of_work: p?.place_of_work || "",
            scope_of_work: p?.scope_of_work || "",
            safety_arrangements: p?.safety_arrangements || "",
            scheduled_start_at: p?.scheduled_start_at
              ? String(p.scheduled_start_at).replace(" ", "T")
              : "",
            estimated_duration_min:
              p?.estimated_duration_min != null
                ? String(p.estimated_duration_min)
                : "",
            switch_off_time: p?.switch_off_time || "",
            restore_time: p?.restore_time || "",
            location_text: p?.location || "",

            // planned hydrate (only if backend provides them)
            planned_from_date: p?.planned_from_date || "",
            planned_to_date: p?.planned_to_date || "",
            planned_schedule: Array.isArray(p?.planned_schedule)
              ? (p.planned_schedule as PlannedScheduleRow[])
              : [],

            team_member_ids: Array.isArray(p?.team_members)
              ? p.team_members.map((m: { id: number }) => m.id)
              : [],
            existing_evidences: Array.isArray(p?.evidences) ? p.evidences : [],
          }));

          // auto-open planned modal if editing and planned type without schedule
          if (p?.type === "PLANNED" && !Array.isArray(p?.planned_schedule)) {
            setPlannedOpen(true);
          }
        }
      } catch (e) {
        toast.error("Failed to load PTW context or data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // ---------- Circuit rules ----------
  useEffect(() => {
    if (form.circuit_type === "SINGLE") {
      if (form.secondary_feeder_ids.length) {
        setForm((p) => ({ ...p, secondary_feeder_ids: [] }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.circuit_type]);

  // Auto-select first primary feeder on SINGLE
  useEffect(() => {
    if (form.circuit_type !== "SINGLE") return;
    if (form.feeder_id) return;
    if (!context.primary_feeders.length) return;

    setForm((p) => ({
      ...p,
      feeder_id: String(context.primary_feeders[0].id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.circuit_type, context.primary_feeders]);

  // ---------- Resolve preview feeder name -> feeder_id ----------
  useEffect(() => {
    if (!previewNames.feederName || !context.primary_feeders?.length) return;
    if (form.feeder_id) return;

    const match = context.primary_feeders.find(
      (f) => f.name === previewNames.feederName,
    );
    if (match) {
      setForm((p) => ({ ...p, feeder_id: String(match.id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewNames.feederName, context.primary_feeders]);

  // ---------- Fetch transformers whenever feeder changes ----------
  useEffect(() => {
    const fetchTransformers = async () => {
      if (!form.feeder_id) {
        setTransformers([]);
        setForm((p) => ({ ...p, transformer_id: "" }));
        return;
      }
      try {
        const res = await api.get(
          `/api/v1/meta/related?feeder_id=${form.feeder_id}`,
        );
        const list: Transformer[] = res.data.lists?.transformers || [];
        setTransformers(list);
      } catch {
        toast.error("Failed to load transformers");
        setTransformers([]);
      }
    };
    fetchTransformers();
  }, [form.feeder_id]);

  // ---------- Resolve preview transformer name -> transformer_id ----------
  useEffect(() => {
    if (!previewNames.transformerName || !transformers.length) return;
    if (form.transformer_id) return;

    const match = transformers.find(
      (t) => t.transformer_id === previewNames.transformerName,
    );
    if (match) {
      setForm((p) => ({ ...p, transformer_id: String(match.id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewNames.transformerName, transformers]);

  // ---------- Evidence handler ----------
  const handleFileChange = (i: number, file: File | null) => {
    setForm((p) => {
      const evidences = [...p.evidences];
      evidences[i] = file;
      return { ...p, evidences };
    });
  };

  // ---------- Auto location ----------
  useEffect(() => {
    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        );
        const data = await res.json();
        return data.display_name || "";
      } catch {
        return "";
      }
    };

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        setForm((prev) => ({
          ...prev,
          location_lat: latitude.toFixed(6),
          location_lng: longitude.toFixed(6),
          location_text: address,
        }));
        toast.success("📍 Location auto-fetched");
      },
      (err) => {
        console.warn("Geo fetch failed:", err);
        toast.error("Unable to fetch location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // ---------- Type handler (PLANNED => open modal) ----------
  const handleTypeChange = (val: string) => {
    const nextType = val as PtwType;

    if (nextType === "PLANNED") {
      setForm((p) => ({ ...p, type: "PLANNED" }));
      setPlannedOpen(true);
      return;
    }

    // switching away from planned: clear planned payload
    setForm((p) => ({
      ...p,
      type: nextType,
      planned_from_date: "",
      planned_to_date: "",
      planned_schedule: [],
    }));
  };

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // planned validation
    if (form.type === "PLANNED") {
      if (
        !form.planned_from_date ||
        !form.planned_to_date ||
        !form.planned_schedule?.length
      ) {
        toast.error("Please complete the planned schedule.");
        setPlannedOpen(true);
        return;
      }
    }

    const fd = new FormData();

    // append primitives
    (
      [
        "current_date",
        "type",
        "misc_type",
        "circuit_type",
        "sub_division_id",
        "feeder_id",
        "transformer_id",
        "feeder_incharge_name",
        "is_ptw_required",
        "close_feeder",
        "alternate_feeder",
        "location_text",
        "location_lat",
        "location_lng",
        "place_of_work",
        "scope_of_work",
        "safety_arrangements",
        "scheduled_start_at",
        "estimated_duration_min",
        "switch_off_time",
        "restore_time",
      ] as const
    ).forEach((k) => fd.append(k, String((form as any)[k] ?? "")));

    // ensure HH:mm
    fd.set("switch_off_time", formatTime(form.switch_off_time));
    fd.set("restore_time", formatTime(form.restore_time));

    // planned payload (nested keys like screenshot)
    if (form.type === "PLANNED") {
      fd.append("planned_from_date", String(form.planned_from_date || ""));
      fd.append("planned_to_date", String(form.planned_to_date || ""));

      (form.planned_schedule || []).forEach((row, idx) => {
        fd.append(`planned_schedule[${idx}][date]`, row.date);
        fd.append(
          `planned_schedule[${idx}][start_time]`,
          formatTime(row.start_time),
        );
        fd.append(
          `planned_schedule[${idx}][end_time]`,
          formatTime(row.end_time),
        );
      });
    }

    // team members
    (form.team_member_ids as number[]).forEach((tmId) =>
      fd.append("team_member_ids[]", String(tmId)),
    );

    // secondary feeders (only for MULTI)
    if (form.circuit_type === "MULTI") {
      (form.secondary_feeder_ids as number[]).forEach((fid) =>
        fd.append("secondary_feeder_ids[]", String(fid)),
      );
    }

    // evidences
    form.evidences.forEach((f, i) => {
      if (f) {
        fd.append(`evidences[${i}][type]`, "SITE_BEFORE_SHUTDOWN");
        fd.append(`evidences[${i}][file]`, f);
      }
    });

    try {
      if (id) {
        await api.post(`/api/v1/ptw/${id}/step1`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("PTW updated successfully");
      } else {
        const res = await api.post(`/api/v1/ptw/init`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newId: number = res?.data?.data?.id;
        if (newId) setId(newId);
        toast.success("PTW created successfully");
      }
      next();
    } catch {
      toast.error("Failed to save PTW data");
    }
  };

  const feederItems: SearchSelectItem[] = context.primary_feeders.map((f) => ({
    id: f.id,
    label: f.name,
    subLabel: `(${f.code})`,
  }));

  const secondaryItems: SearchSelectItem[] = context.secondary_feeders.map(
    (f) => ({
      id: f.id,
      label: f.name,
      subLabel: `(${f.code})`,
    }),
  );

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading PTW context...
      </div>
    );

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 border-b bg-white/80 backdrop-blur-sm z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-800">
            PTW — Basic Information / بنیادی معلومات
          </h1>
          <p className="text-xs text-slate-500">
            {id ? `Editing Permit #${id}` : "Create New Permit"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl px-6 pt-6 pb-24 space-y-6"
      >
        
        <PlannedScheduleModal
          open={plannedOpen}
          onClose={() => {
            setPlannedOpen(false);

            // optional: if user closes planned without saving, revert to MISC
            setForm((p) => {
              if (
                p.type === "PLANNED" &&
                (!p.planned_from_date ||
                  !p.planned_to_date ||
                  !p.planned_schedule?.length)
              ) {
                return { ...p, type: "MISC" };
              }
              return p;
            });
          }}
          initialFrom={form.planned_from_date || undefined}
          initialTo={form.planned_to_date || undefined}
          initialSchedule={form.planned_schedule || undefined}
          onSave={({ planned_from_date, planned_to_date, planned_schedule }) => {
            setForm((p) => ({
              ...p,
              planned_from_date,
              planned_to_date,
              planned_schedule,
            }));
          }}
        />

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Current Date / تاریخ</FormLabel>
              <FormInput
                value={form.current_date}
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div>
              <FormLabel>Type / قسم</FormLabel>
              <FormSelect
                required
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="MISC">MISC</option>
                <option value="PLANNED">PLANNED</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </FormSelect>
            </div>

            {/* Planned Summary Card */}
            {form.type === "PLANNED" ? (
              <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      Planned Window
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {form.planned_from_date && form.planned_to_date
                        ? `${form.planned_from_date} → ${form.planned_to_date}`
                        : "Not set"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Days: {form.planned_schedule?.length || 0}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => setPlannedOpen(true)}
                  >
                    Edit Schedule
                  </Button>
                </div>

                {!form.planned_schedule?.length ? (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Schedule not set yet. Please click “Edit Schedule”.
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* PTW Required */}
            <div className="col-span-2">
              <FormLabel>PTW Required? / پی ٹی ڈبلیو ضروری ہے؟</FormLabel>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_ptw_required"
                    value="YES"
                    checked={form.is_ptw_required === "YES"}
                    onChange={() =>
                      setForm((p) => ({ ...p, is_ptw_required: "YES" }))
                    }
                  />
                  <span>Yes / ہاں</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_ptw_required"
                    value="NO"
                    checked={form.is_ptw_required === "NO"}
                    onChange={() =>
                      setForm((p) => ({ ...p, is_ptw_required: "NO" }))
                    }
                  />
                  <span>No / نہیں</span>
                </label>
              </div>
            </div>

            {/* Circuit Type */}
            <div className="col-span-2">
              <FormLabel>Circuit Type / سرکٹ کی قسم</FormLabel>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="circuit_type"
                    value="SINGLE"
                    checked={form.circuit_type === "SINGLE"}
                    onChange={() =>
                      setForm((p) => ({ ...p, circuit_type: "SINGLE" }))
                    }
                  />
                  <span>Single Circuit / سنگل سرکٹ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="circuit_type"
                    value="MULTI"
                    checked={form.circuit_type === "MULTI"}
                    onChange={() =>
                      setForm((p) => ({ ...p, circuit_type: "MULTI" }))
                    }
                  />
                  <span>Multi Circuit / ملٹی سرکٹ</span>
                </label>
              </div>
            </div>

            {form.type === "MISC" && (
              <div>
                <FormLabel>Misc Type / متفرق نوعیت</FormLabel>
                <FormSelect
                  required
                  value={form.misc_type}
                  onChange={(e) =>
                    setForm({ ...form, misc_type: e.target.value })
                  }
                >
                  <option value="">Select Misc Type</option>
                  <option value="MCO">MCO</option>
                  <option value="SCO">SCO</option>
                  <option value="RCO">RCO</option>
                  <option value="DCO">DCO</option>
                  <option value="COMPLAINT">COMPLAINT</option>
                </FormSelect>
              </div>
            )}

            <div>
              <FormLabel>Sub Division / سب ڈویژن</FormLabel>
              <FormInput
                value={context.sub_division?.name || ""}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>

          {/* Primary Feeder */}
          <div>
            <SearchSelect
              label="Primary Feeder / بنیادی فیڈر"
              items={feederItems}
              value={form.feeder_id ? Number(form.feeder_id) : null}
              onChange={(val) =>
                setForm((p) => ({ ...p, feeder_id: val ? String(val) : "" }))
              }
              required
            />
          </div>

          {/* Secondary Feeders - MULTI only */}
          {form.circuit_type === "MULTI" && (
            <div>
              <SearchSelect
                label="Secondary Feeders / سیکنڈری فیڈرز"
                multi
                items={secondaryItems}
                values={form.secondary_feeder_ids}
                onChangeMulti={(vals) =>
                  setForm((p) => ({
                    ...p,
                    secondary_feeder_ids: vals as number[],
                  }))
                }
              />
            </div>
          )}

          <div>
            <FormLabel>Transformer / ٹرانسفارمر</FormLabel>
            <FormSelect
              required
              value={form.transformer_id}
              onChange={(e) =>
                setForm({ ...form, transformer_id: e.target.value })
              }
              disabled={!form.feeder_id}
            >
              <option value="">
                {form.feeder_id
                  ? transformers.length
                    ? "Select Transformer"
                    : "No transformers found"
                  : "Select Feeder first"}
              </option>
              {transformers.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.transformer_id} — {t.transformer_ref_no}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>Switch Off Time / بجلی بند</FormLabel>
              <FormInput
                required
                type="time"
                value={form.switch_off_time}
                onChange={(e) =>
                  setForm({ ...form, switch_off_time: e.target.value })
                }
              />
            </div>
            <div>
              <FormLabel>Restore Time / بحالی</FormLabel>
              <FormInput
                required
                type="time"
                value={form.restore_time}
                onChange={(e) =>
                  setForm({ ...form, restore_time: e.target.value })
                }
              />
            </div>
            <div>
              <FormLabel>Duration (Minutes) / دورانیہ</FormLabel>
              <FormInput
                required
                type="number"
                value={form.estimated_duration_min}
                onChange={(e) =>
                  setForm({ ...form, estimated_duration_min: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <FormLabel>Feeder Incharge / فیڈر انچارج</FormLabel>
            <FormInput
              required
              value={form.feeder_incharge_name}
              onChange={(e) =>
                setForm({ ...form, feeder_incharge_name: e.target.value })
              }
            />
          </div>

          <div>
            <FormLabel>Place of Work / کام کی جگہ</FormLabel>
            <FormInput
              required
              value={form.place_of_work}
              onChange={(e) =>
                setForm({ ...form, place_of_work: e.target.value })
              }
              placeholder="Enter place of work"
            />
          </div>

          <div>
            <FormLabel>Location / مقام</FormLabel>
            <FormInput value={form.location_text} className="bg-gray-100" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <FormInput value={form.location_lat} className="bg-gray-100" />
              <FormInput value={form.location_lng} className="bg-gray-100" />
            </div>
          </div>

          <div>
            <FormLabel>Team Members / ٹیم ممبرز</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {context.team_members.map((m) => (
                <label
                  key={m.id}
                  className={`border rounded p-2 flex items-center gap-2 cursor-pointer ${
                    form.team_member_ids.includes(m.id)
                      ? "border-primary bg-primary/10"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.team_member_ids.includes(m.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        team_member_ids: checked
                          ? [...prev.team_member_ids, m.id]
                          : prev.team_member_ids.filter((id) => id !== m.id),
                      }));
                    }}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <FormLabel>Description / Scope of Work کام کی تفصیل</FormLabel>
            <FormTextarea
              required
              rows={3}
              value={form.scope_of_work}
              onChange={(e) =>
                setForm({ ...form, scope_of_work: e.target.value })
              }
            />
          </div>

          <div>
            <FormLabel>Safety Arrangements / حفاظتی انتظامات</FormLabel>
            <FormTextarea
              required
              rows={3}
              value={form.safety_arrangements}
              onChange={(e) =>
                setForm({ ...form, safety_arrangements: e.target.value })
              }
            />
          </div>

          <div>
            <FormLabel>Evidence Photos (max 3) / شواہد</FormLabel>

            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 3 }).map((_, i) => {
                const existing = form.existing_evidences?.[i];
                const file = form.evidences[i];

                const previewUrl = file
                  ? URL.createObjectURL(file)
                  : existing
                    ? existing.file_path.startsWith("http")
                      ? existing.file_path
                      : `${
                          api.defaults.baseURL?.split("/api")[0]
                        }/storage/${existing.file_path}`
                    : null;

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 border rounded-lg p-2 shadow-sm bg-slate-50"
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={`Evidence ${i + 1}`}
                        className="w-28 h-28 object-cover rounded-md border cursor-pointer hover:scale-105 transition"
                        onClick={() =>
                          document.getElementById(`evidence-${i}`)?.click()
                        }
                      />
                    ) : (
                      <div
                        className="w-28 h-28 flex items-center justify-center border-2 border-dashed rounded-md text-slate-400 cursor-pointer hover:bg-slate-100"
                        onClick={() =>
                          document.getElementById(`evidence-${i}`)?.click()
                        }
                      >
                        Upload
                      </div>
                    )}

                    <input
                      id={`evidence-${i}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(i, e.target.files?.[0] || null)
                      }
                    />
                    <p className="text-[11px] text-slate-600">
                      {existing
                        ? existing.type.replaceAll("_", " ")
                        : "New Evidence"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="reset" variant="outline-secondary">
              Reset / ری سیٹ
            </Button>
            <Button type="submit" variant="primary">
              {id ? "Update / اپ ڈیٹ" : "Submit / جمع کروائیں"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
