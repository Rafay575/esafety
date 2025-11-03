"use client";
import React, { useEffect, useState } from "react";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import FormLabel from "@/components/Base/Form/FormLabel";
import Button from "@/components/Base/Button";
import { toast } from "sonner";
import { api } from "@/lib/axios";

type Feeder = { id: number; name: string; code: string };
type Transformer = { id: number; transformer_id: string; transformer_ref_no: string };
type TeamMember = { id: number; name: string; avatar_url: string };

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
    feeders: Feeder[];
    team_members: TeamMember[];
  }>({ feeders: [], team_members: [] });

  const [transformers, setTransformers] = useState<Transformer[]>([]);

  // remember preview names so we can map -> IDs when lists load
  const [previewNames, setPreviewNames] = useState<{
    feederName?: string;
    transformerName?: string;
  }>({});

  const today = new Date().toISOString().split("T")[0];

  // Keep all form fields as strings for inputs/selects, convert on submit
  const [form, setForm] = useState({
    current_date: today,
    type: "MISC",
    misc_type: "",
    sub_division_id: "", // stringified ID
    feeder_id: "", // stringified ID
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
  // If browser gives HH:MM:SS, take first two parts only
  const [h, m] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
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
          feeders: (ctx.feeders ?? []) as Feeder[],
          team_members: (ctx.team_members ?? []) as TeamMember[],
        });

        setForm((p) => ({ ...p, sub_division_id: sdId }));

        if (id) {
          const { data } = await api.get(`/api/v1/ptw/${id}/preview`);
          const p = data?.data?.ptw;

          // store names to resolve to IDs once lists are ready
          setPreviewNames({
            feederName: p?.feeder_name ?? undefined,
            transformerName: p?.transformer_name ?? undefined,
          });

          setForm((prev) => ({
            ...prev,
            type: p?.type || "MISC",
            misc_type: p?.misc_type || "",
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
            // feeder_id, transformer_id resolved in effects below
            team_member_ids: Array.isArray(p?.team_members)
              ? p.team_members.map((m: { id: number }) => m.id)
              : [],
              existing_evidences: Array.isArray(p?.evidences) ? p.evidences : [],

          }));
        }
      } catch (e) {
        toast.error("Failed to load PTW context or data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);
// 🔹 Auto detect & reverse geocode location (always refresh)


  // ---------- If we have a feeder name from preview, map it to the ID ----------
  useEffect(() => {
    if (!previewNames.feederName || !context.feeders?.length) return;
    // only set if not already set
    if (form.feeder_id) return;

    const match = context.feeders.find((f) => f.name === previewNames.feederName);
    if (match) {
      setForm((p) => ({ ...p, feeder_id: String(match.id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewNames.feederName, context.feeders]);

  // ---------- Fetch transformers whenever feeder changes ----------
  useEffect(() => {
    const fetchTransformers = async () => {
      if (!form.feeder_id) {
        setTransformers([]);
        setForm((p) => ({ ...p, transformer_id: "" }));
        return;
      }
      try {
        const res = await api.get(`/api/v1/meta/related?feeder_id=${form.feeder_id}`);
        const list: Transformer[] = res.data.lists?.transformers || [];
        setTransformers(list);
      } catch {
        toast.error("Failed to load transformers");
        setTransformers([]);
      }
    };
    fetchTransformers();
  }, [form.feeder_id]);

  // ---------- If we have a transformer name from preview, map it to the ID ----------
  useEffect(() => {
    if (!previewNames.transformerName || !transformers.length) return;
    if (form.transformer_id) return;

    // preview returns transformer_name like "T15000..." which matches transformer's transformer_id
    const match = transformers.find(
      (t) => t.transformer_id === previewNames.transformerName
    );
    if (match) {
      setForm((p) => ({ ...p, transformer_id: String(match.id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewNames.transformerName, transformers]);

  // ---------- Evidence handler (was missing) ----------
  const handleFileChange = (i: number, file: File | null) => {
    setForm((p) => {
      const evidences = [...p.evidences];
      evidences[i] = file;
      return { ...p, evidences };
    });
  };

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();

    // append primitives
    (
      [
        "current_date",
        "type",
        "misc_type",
        "sub_division_id",
        "feeder_id",
        "transformer_id",
        "feeder_incharge_name",
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
fd.append("switch_off_time", formatTime(form.switch_off_time));
fd.append("restore_time", formatTime(form.restore_time));
    // team members
    (form.team_member_ids as number[]).forEach((tmId) =>
      fd.append("team_member_ids[]", String(tmId))
    );

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
useEffect(() => {
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
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
    { enableHighAccuracy: true, timeout: 10000 }
  );
}, []);
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
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Current Date / تاریخ</FormLabel>
              <FormInput value={form.current_date} readOnly className="bg-gray-100" />
            </div>

            <div>
              <FormLabel>Type / قسم</FormLabel>
              <FormSelect
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="MISC">MISC</option>
                <option value="PLANNED">PLANNED</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </FormSelect>
            </div>

            {form.type === "MISC" && (
              <div>
                <FormLabel>Misc Type / متفرق نوعیت</FormLabel>
                <FormSelect
                  required
                  value={form.misc_type}
                  onChange={(e) => setForm({ ...form, misc_type: e.target.value })}
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

          <div>
            <FormLabel>Feeder / فیڈر</FormLabel>
            <FormSelect
              required
              value={form.feeder_id}
              onChange={(e) => setForm({ ...form, feeder_id: e.target.value })}
            >
              <option value="">Select Feeder</option>
              {context.feeders.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name} ({f.code})
                </option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Transformer / ٹرانسفارمر</FormLabel>
            <FormSelect
              required
              value={form.transformer_id}
              onChange={(e) => setForm({ ...form, transformer_id: e.target.value })}
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

          <div>
            <FormLabel>Place of Work / کام کی جگہ</FormLabel>
            <FormInput
              required
              value={form.place_of_work}
              onChange={(e) => setForm({ ...form, place_of_work: e.target.value })}
              placeholder="Enter place of work"
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>Close Feeder / بند فیڈر</FormLabel>
              <FormInput
                required
                value={form.close_feeder}
                onChange={(e) => setForm({ ...form, close_feeder: e.target.value })}
              />
            </div>
            <div>
              <FormLabel>Alternate Feeder / متبادل فیڈر</FormLabel>
              <FormInput
                required
                value={form.alternate_feeder}
                onChange={(e) =>
                  setForm({ ...form, alternate_feeder: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <FormLabel>Scope of Work / کام کی تفصیل</FormLabel>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>Scheduled Start / آغاز</FormLabel>
              <FormInput
                required
                type="datetime-local"
                value={form.scheduled_start_at}
                onChange={(e) =>
                  setForm({ ...form, scheduled_start_at: e.target.value })
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
          </div>

          <div>
            <FormLabel>Location / مقام</FormLabel>
            <FormInput  value={form.location_text} className="bg-gray-100" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <FormInput  value={form.location_lat} className="bg-gray-100" />
              <FormInput  value={form.location_lng} className="bg-gray-100" />
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
          : `${api.defaults.baseURL?.split("/api")[0]}/storage/${existing.file_path}`
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
            {existing ? existing.type.replaceAll("_", " ") : "New Evidence"}
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
