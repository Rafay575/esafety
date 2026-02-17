"use client";
import React, { useEffect, useState, useRef } from "react";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import FormLabel from "@/components/Base/Form/FormLabel";
import Button from "@/components/Base/Button";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import SearchSelect, { SearchSelectItem } from "@/components/SearchSelect";
import PlannedScheduleModal, {
  PlannedScheduleRow,
} from "@/components/PlannedScheduleModal";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";

// ---------- Types ----------
type Feeder = { id: number; name: string; code: string };
type Transformer = {
  id: number;
  transformer_id: string;
  transformer_ref_no: string;
};
type TeamMember = { id: number; name: string; avatar_url: string };
type PtwType = "MISC" | "PLANNED" | "EMERGENCY";

// ---------- Google Maps API key helper ----------
const getGoogleMapsApiKey = (): string => {
  // Next.js style
  // if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  //   return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  // }
  // Vite style (must be prefixed with VITE_)
  if (typeof import.meta !== 'undefined' && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
  console.error("Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or VITE_GOOGLE_MAPS_API_KEY");
  return "";
};

const mapContainerStyle = { width: "100%", height: "300px" };
const defaultCenter = { lat: 33.6844, lng: 73.0479 }; // fallback (Islamabad)

// ---------- Main Component ----------
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
  const [plannedOpen, setPlannedOpen] = useState(false);

  // remember preview names so we can map -> IDs when lists load
  const [previewNames, setPreviewNames] = useState<{
    feederName?: string;
    transformerName?: string;
  }>({});

  // ---------- Google Maps state ----------
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ["places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // ---------- Form state ----------
  const [form, setForm] = useState({
    current_date: today,
    type: "MISC" as PtwType,
    misc_type: "",
    reference_no: "",
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

  // ---------- Google Maps initialisation ----------
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Local marker state (syncs with form)
  const [markerPosition, setMarkerPosition] = useState(() => {
    if (form.location_lat && form.location_lng) {
      return { lat: parseFloat(form.location_lat), lng: parseFloat(form.location_lng) };
    }
    return defaultCenter;
  });
  const [address, setAddress] = useState(form.location_text);

  // Update marker when form lat/lng change (e.g., from auto-fetch)
  useEffect(() => {
    if (form.location_lat && form.location_lng) {
      setMarkerPosition({
        lat: parseFloat(form.location_lat),
        lng: parseFloat(form.location_lng),
      });
    }
  }, [form.location_lat, form.location_lng]);

  // Auto‑fetch location when map loads (only for new PTWs and if fields are empty)
  useEffect(() => {
    if (!isLoaded || !map || !geocoderRef.current) return;
    if (id) return; // skip for existing PTWs
    if (form.location_lat && form.location_lng && form.location_text) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPos = { lat: latitude, lng: longitude };
          setMarkerPosition(newPos);
          map.panTo(newPos);
          map.setZoom(15);

          geocoderRef.current?.geocode(
            { location: newPos },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                const address = results[0].formatted_address;
                setAddress(address);
                setForm((prev) => ({
                  ...prev,
                  location_lat: latitude.toFixed(6),
                  location_lng: longitude.toFixed(6),
                  location_text: address,
                }));
                toast.success("📍 Location auto-fetched");
              } else {
                // fallback to coordinates
                const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setAddress(fallback);
                setForm((prev) => ({
                  ...prev,
                  location_lat: latitude.toFixed(6),
                  location_lng: longitude.toFixed(6),
                  location_text: fallback,
                }));
              }
            }
          );
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.error("Unable to fetch your location. You can drag the marker to set it.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Geolocation not supported by this browser");
    }
  }, [isLoaded, map, id, form.location_lat, form.location_lng, form.location_text]);

  // Marker drag handler
  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const newAddress = results[0].formatted_address;
            setAddress(newAddress);
            setForm((prev) => ({
              ...prev,
              location_lat: lat.toFixed(6),
              location_lng: lng.toFixed(6),
              location_text: newAddress,
            }));
          } else {
            const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(fallback);
            setForm((prev) => ({
              ...prev,
              location_lat: lat.toFixed(6),
              location_lng: lng.toFixed(6),
              location_text: fallback,
            }));
          }
        });
      }
    }, 300);
  };

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // Places search (optional)
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    if (!isLoaded || !map) return;
    const input = document.getElementById("map-search-input") as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["geocode"],
    });
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMarkerPosition({ lat, lng });
      setAddress(place.formatted_address || "");
      setForm((prev) => ({
        ...prev,
        location_lat: lat.toFixed(6),
        location_lng: lng.toFixed(6),
        location_text: place.formatted_address || "",
      }));
      map.panTo({ lat, lng });
      map.setZoom(15);
    });

    return () => google.maps.event.clearInstanceListeners(autocomplete);
  }, [isLoaded, map]);

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

          setForm((prev) => ({
            ...prev,
            type: (p?.type as PtwType) || "MISC",
            misc_type: p?.misc_type || "",
            reference_no: p?.reference_no || "",
            circuit_type: (p?.circuit_type as "SINGLE" | "MULTI") || prev.circuit_type,
            is_ptw_required: (p?.is_ptw_required as "YES" | "NO") || prev.is_ptw_required,

            feeder_incharge_name: p?.feeder_incharge_name || "",
            close_feeder: p?.close_feeder || "",
            alternate_feeder: p?.alternate_feeder || "",
            place_of_work: p?.place_of_work || "",
            scope_of_work: p?.scope_of_work || "",
            safety_arrangements: p?.safety_arrangements || "",
            scheduled_start_at: p?.scheduled_start_at ? String(p.scheduled_start_at).replace(" ", "T") : "",
            estimated_duration_min: p?.estimated_duration_min != null ? String(p.estimated_duration_min) : "",
            switch_off_time: p?.switch_off_time || "",
            restore_time: p?.restore_time || "",
            location_text: p?.location || "",
            location_lat: p?.location_lat || "",
            location_lng: p?.location_lng || "",

            planned_from_date: p?.planned_from_date || "",
            planned_to_date: p?.planned_to_date || "",
            planned_schedule: Array.isArray(p?.planned_schedule) ? (p.planned_schedule as PlannedScheduleRow[]) : [],

            team_member_ids: Array.isArray(p?.team_members) ? p.team_members.map((m: { id: number }) => m.id) : [],
            existing_evidences: Array.isArray(p?.evidences) ? p.evidences : [],
          }));

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
  }, [form.circuit_type]);

  useEffect(() => {
    const isMiscNoPtw = form.type === "MISC" && form.is_ptw_required === "NO";
    if (isMiscNoPtw) {
      setForm((p) => ({
        ...p,
        circuit_type: "SINGLE",
        secondary_feeder_ids: [],
      }));
    }
  }, [form.type, form.is_ptw_required]);

  // Auto-select first primary feeder on SINGLE
  useEffect(() => {
    if (form.circuit_type !== "SINGLE") return;
    if (form.feeder_id) return;
    if (!context.primary_feeders.length) return;

    setForm((p) => ({
      ...p,
      feeder_id: String(context.primary_feeders[0].id),
    }));
  }, [form.circuit_type, context.primary_feeders]);

  // Resolve preview feeder name -> feeder_id
  useEffect(() => {
    if (!previewNames.feederName || !context.primary_feeders?.length) return;
    if (form.feeder_id) return;

    const match = context.primary_feeders.find(
      (f) => f.name === previewNames.feederName
    );
    if (match) setForm((p) => ({ ...p, feeder_id: String(match.id) }));
  }, [previewNames.feederName, context.primary_feeders]);

  // Fetch transformers when feeder changes
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

  // Resolve preview transformer name -> transformer_id
  useEffect(() => {
    if (!previewNames.transformerName || !transformers.length) return;
    if (form.transformer_id) return;

    const match = transformers.find(
      (t) => t.transformer_id === previewNames.transformerName
    );
    if (match) setForm((p) => ({ ...p, transformer_id: String(match.id) }));
  }, [previewNames.transformerName, transformers]);

  // Evidence handler
  const handleFileChange = (i: number, file: File | null) => {
    setForm((p) => {
      const evidences = [...p.evidences];
      evidences[i] = file;
      return { ...p, evidences };
    });
  };

  // Type handler (PLANNED => open modal)
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
      if (!form.planned_from_date || !form.planned_to_date || !form.planned_schedule?.length) {
        toast.error("Please complete the planned schedule.");
        setPlannedOpen(true);
        return;
      }
    }

    // misc validation
    if (form.type === "MISC") {
      if (!form.misc_type) {
        toast.error("Please select Misc Type.");
        return;
      }
      if (!form.reference_no?.trim()) {
        toast.error("Please enter Reference Number.");
        return;
      }
    }

    const fd = new FormData();

    (
      [
        "current_date",
        "type",
        "misc_type",
        "reference_no",
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

    fd.set("switch_off_time", formatTime(form.switch_off_time));
    fd.set("restore_time", formatTime(form.restore_time));

    // planned payload
    if (form.type === "PLANNED") {
      fd.append("planned_from_date", String(form.planned_from_date || ""));
      fd.append("planned_to_date", String(form.planned_to_date || ""));

      (form.planned_schedule || []).forEach((row, idx) => {
        fd.append(`planned_schedule[${idx}][date]`, row.date);
        fd.append(`planned_schedule[${idx}][start_time]`, formatTime(row.start_time));
        fd.append(`planned_schedule[${idx}][end_time]`, formatTime(row.end_time));
      });
    }

    // team members
    (form.team_member_ids as number[]).forEach((tmId) =>
      fd.append("team_member_ids[]", String(tmId))
    );

    // secondary feeders (only for MULTI)
    if (form.circuit_type === "MULTI") {
      (form.secondary_feeder_ids as number[]).forEach((fid) =>
        fd.append("secondary_feeder_ids[]", String(fid))
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
      next();
    }
  };

  // Items for search selects
  const feederItems: SearchSelectItem[] = context.primary_feeders.map((f) => ({
    id: f.id,
    label: f.name,
    subLabel: `(${f.code})`,
  }));

  const secondaryItems: SearchSelectItem[] = context.secondary_feeders.map((f) => ({
    id: f.id,
    label: f.name,
    subLabel: `(${f.code})`,
  }));
 const teamItems: SearchSelectItem[] = context.team_members.map((m) => ({
    id: m.id,
    label: m.name,
  }));
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading PTW context...
      </div>
    );

  const hideSecondaryForMiscNoPtw = form.type === "MISC" && form.is_ptw_required === "NO";

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 border-b bg-white/80 backdrop-blur-sm z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-800">
            PTW — Basic Information / <span className="font-urdu">بنیادی معلومات</span>
          </h1>
          <p className="text-xs text-slate-500">
            {id ? `Editing Permit #${id}` : "Create New Permit"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl px-6 pt-6 pb-24 space-y-6">
        <PlannedScheduleModal
          open={plannedOpen}
          onClose={() => {
            setPlannedOpen(false);
            setForm((p) => {
              if (p.type === "PLANNED" && (!p.planned_from_date || !p.planned_to_date || !p.planned_schedule?.length)) {
                return { ...p, type: "MISC" };
              }
              return p;
            });
          }}
          initialFrom={form.planned_from_date || undefined}
          initialTo={form.planned_to_date || undefined}
          initialSchedule={form.planned_schedule || undefined}
          onSave={({ planned_from_date, planned_to_date, planned_schedule }) => {
            setForm((p) => ({ ...p, planned_from_date, planned_to_date, planned_schedule }));
          }}
        />

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>
                Current Date / <span className="font-urdu">تاریخ</span>
              </FormLabel>
              <FormInput value={form.current_date} readOnly className="bg-gray-100" />
            </div>
            <div>
              <FormLabel>
                Sub Division / <span className="font-urdu">سب ڈویژن</span>
              </FormLabel>
              <FormInput value={context.sub_division?.name || ""} readOnly className="bg-gray-100" />
            </div>
            <div>
              <FormLabel>
                Type / <span className="font-urdu">قسم</span>
              </FormLabel>
              <FormSelect required value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
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
                    <div className="text-sm font-semibold text-slate-700">Planned Window</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {form.planned_from_date && form.planned_to_date
                        ? `${form.planned_from_date} → ${form.planned_to_date}`
                        : "Not set"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Days: {form.planned_schedule?.length || 0}</div>
                  </div>
                  <Button type="button" variant="outline-secondary" onClick={() => setPlannedOpen(true)}>
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

            {form.type === "MISC" && (
              <div className="col-span-2">
                <FormLabel>
                  PTW Required? / <span className="font-urdu">پی ٹی ڈبلیو ضروری ہے؟</span>
                </FormLabel>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_ptw_required"
                      value="YES"
                      checked={form.is_ptw_required === "YES"}
                      onChange={() => setForm((p) => ({ ...p, is_ptw_required: "YES" }))}
                    />
                    <span>Yes / <span className="font-urdu">ہاں</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_ptw_required"
                      value="NO"
                      checked={form.is_ptw_required === "NO"}
                      onChange={() => setForm((p) => ({ ...p, is_ptw_required: "NO" }))}
                    />
                    <span>No / <span className="font-urdu">نہیں</span></span>
                  </label>
                </div>
              </div>
            )}

            {/* Circuit Type */}
            <div className="col-span-2">
              <FormLabel>
                Circuit Type / <span className="font-urdu">سرکٹ کی قسم</span>
              </FormLabel>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="circuit_type"
                    value="SINGLE"
                    checked={form.circuit_type === "SINGLE"}
                    onChange={() => setForm((p) => ({ ...p, circuit_type: "SINGLE" }))}
                    disabled={hideSecondaryForMiscNoPtw}
                  />
                  <span>Single Circuit / <span className="font-urdu">سنگل سرکٹ</span></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="circuit_type"
                    value="MULTI"
                    checked={form.circuit_type === "MULTI"}
                    onChange={() => setForm((p) => ({ ...p, circuit_type: "MULTI" }))}
                    disabled={hideSecondaryForMiscNoPtw}
                  />
                  <span>Multi Circuit / <span className="font-urdu">ملٹی سرکٹ</span></span>
                </label>
              </div>
              {hideSecondaryForMiscNoPtw ? (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  Secondary feeders disabled because PTW Required is <b>NO</b> in MISC.
                </div>
              ) : null}
            </div>

            {form.type === "MISC" && (
              <>
                <div>
                  <FormLabel>
                    Misc Type / <span className="font-urdu">متفرق نوعیت</span>
                  </FormLabel>
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
                <div>
                  <FormLabel>
                    {form.misc_type} No / <span className="font-urdu">ریفرنس نمبر</span>
                  </FormLabel>
                  <FormInput
                    required
                    value={form.reference_no}
                    onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                    placeholder="Enter reference number"
                  />
                </div>
              </>
            )}
          </div>

          {/* Primary Feeder */}
          <div>
            <FormLabel>
              Primary Feeder / <span className="font-urdu">بنیادی فیڈر</span>
            </FormLabel>
            <SearchSelect
              items={feederItems}
              value={form.feeder_id ? Number(form.feeder_id) : null}
              onChange={(val) => setForm((p) => ({ ...p, feeder_id: val ? String(val) : "" }))}
              required
            />
          </div>

          {/* Secondary Feeders - MULTI only */}
          {form.circuit_type === "MULTI" && !hideSecondaryForMiscNoPtw && (
            <div>
              <FormLabel>
                Secondary Feeders / <span className="font-urdu">سیکنڈری فیڈرز</span>
              </FormLabel>
              <SearchSelect
                multi
                items={secondaryItems}
                values={form.secondary_feeder_ids}
                onChangeMulti={(vals) => setForm((p) => ({ ...p, secondary_feeder_ids: vals as number[] }))}
              />
            </div>
          )}

          {/* Transformer */}
         <div>
  <FormLabel>
    Transformer / <span className="font-urdu">ٹرانسفارمر</span>
  </FormLabel>
  <SearchSelect
    items={transformers.map(t => ({
      id: t.id,
      label: `${t.transformer_id} — ${t.transformer_ref_no}`,
    }))}
    value={form.transformer_id ? Number(form.transformer_id) : null}
    onChange={(val) => setForm((p) => ({ ...p, transformer_id: val ? String(val) : "" }))}
    disabled={!form.feeder_id}
    required
    placeholder={form.feeder_id 
      ? transformers.length 
        ? "Select Transformer" 
        : "No transformers found"
      : "Select Feeder first"}
  />
</div>

          {/* Times and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>
                Switch Off Time / <span className="font-urdu">بجلی بند</span>
              </FormLabel>
              <FormInput
                required
                type="time"
                value={form.switch_off_time}
                onChange={(e) => setForm({ ...form, switch_off_time: e.target.value })}
              />
            </div>
            <div>
              <FormLabel>
                Restore Time / <span className="font-urdu">بحالی</span>
              </FormLabel>
              <FormInput
                required
                type="time"
                value={form.restore_time}
                onChange={(e) => setForm({ ...form, restore_time: e.target.value })}
              />
            </div>
            <div>
              <FormLabel>
                Duration (Minutes) / <span className="font-urdu">دورانیہ</span>
              </FormLabel>
              <FormInput
                required
                type="number"
                value={form.estimated_duration_min}
                onChange={(e) => setForm({ ...form, estimated_duration_min: e.target.value })}
              />
            </div>
          </div>

          {/* Feeder Incharge */}
          <div>
            <FormLabel>
              Feeder Incharge / <span className="font-urdu">فیڈر انچارج</span>
            </FormLabel>
            <FormInput
              required
              value={form.feeder_incharge_name}
              onChange={(e) => setForm({ ...form, feeder_incharge_name: e.target.value })}
            />
          </div>

          {/* Place of Work */}
          <div>
            <FormLabel>
              Place of Work / <span className="font-urdu">کام کی جگہ</span>
            </FormLabel>
            <FormInput
              required
              value={form.place_of_work}
              onChange={(e) => setForm({ ...form, place_of_work: e.target.value })}
              placeholder="Enter place of work"
            />
          </div>

          {/* ---------- Location Section with Inline Map ---------- */}
          <div>
            <FormLabel>
              Location / <span className="font-urdu">مقام</span>
            </FormLabel>

            {/* Search box (optional) */}
            {/* {isLoaded && (
              <div className="mb-2">
                <input
                  id="map-search-input"
                  type="text"
                  placeholder="Search for a place..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            )} */}

            {/* Map */}
            {loadError ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-600">
                Error loading Google Maps. Please check your API key.
              </div>
            ) : !isLoaded ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg bg-slate-100">
                Loading map...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={markerPosition}
                zoom={15}
                onLoad={onMapLoad}
              >
                <Marker position={markerPosition} draggable onDragEnd={onMarkerDragEnd} />
              </GoogleMap>
            )}

            {/* Address and coordinates (read-only) */}
            <div className="mt-3 grid grid-cols-1 gap-2">
              <FormInput
                value={form.location_text}
                readOnly
                className="bg-gray-100"
                placeholder="Address will appear here"
              />
              <div className="grid grid-cols-2 gap-2">
                <FormInput
                  value={form.location_lat}
                  readOnly
                  className="bg-gray-100"
                  placeholder="Latitude"
                />
                <FormInput
                  value={form.location_lng}
                  readOnly
                  className="bg-gray-100"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* Button to re-center to current location */}
            <Button
              type="button"
              variant="outline-secondary"
              className="mt-2"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      const newPos = { lat: latitude, lng: longitude };
                      setMarkerPosition(newPos);
                      map?.panTo(newPos);
                      map?.setZoom(15);
                      geocoderRef.current?.geocode(
                        { location: newPos },
                        (results, status) => {
                          if (status === "OK" && results?.[0]) {
                            const address = results[0].formatted_address;
                            setAddress(address);
                            setForm((prev) => ({
                              ...prev,
                              location_lat: latitude.toFixed(6),
                              location_lng: longitude.toFixed(6),
                              location_text: address,
                            }));
                          } else {
                            const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                            setAddress(fallback);
                            setForm((prev) => ({
                              ...prev,
                              location_lat: latitude.toFixed(6),
                              location_lng: longitude.toFixed(6),
                              location_text: fallback,
                            }));
                          }
                        }
                      );
                    },
                    () => toast.error("Unable to get your location")
                  );
                }
              }}
            >
              Use my current location
            </Button>
          </div>
          {/* ---------- End Location Section ---------- */}

          {/* Team Members */}
        <div>
  <FormLabel>
    Team Members / <span className="font-urdu">ٹیم ممبرز</span>
  </FormLabel>
  <SearchSelect
    multi
    items={teamItems}
    values={form.team_member_ids}
    onChangeMulti={(vals) => setForm(prev => ({ ...prev, team_member_ids: vals as number[] }))}
    placeholder="Select team members..."
  />
</div>
          {/* Scope of Work */}
          <div>
            <FormLabel>
              Description / Scope of Work <span className="font-urdu">کام کی تفصیل</span>
            </FormLabel>
            <FormTextarea
              required
              rows={3}
              value={form.scope_of_work}
              onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })}
            />
          </div>

          {/* Safety Arrangements */}
          <div>
            <FormLabel>
              Safety Arrangements / <span className="font-urdu">حفاظتی انتظامات</span>
            </FormLabel>
            <FormTextarea
              required
              rows={3}
              value={form.safety_arrangements}
              onChange={(e) => setForm({ ...form, safety_arrangements: e.target.value })}
            />
          </div>

          {/* Evidence Photos */}
          <div>
            <FormLabel>
              Evidence Photos (max 3) / <span className="font-urdu">شواہد</span>
            </FormLabel>
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
                  <div key={i} className="flex flex-col items-center gap-2 border rounded-lg p-2 shadow-sm bg-slate-50">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={`Evidence ${i + 1}`}
                        className="w-28 h-28 object-cover rounded-md border cursor-pointer hover:scale-105 transition"
                        onClick={() => document.getElementById(`evidence-${i}`)?.click()}
                      />
                    ) : (
                      <div
                        className="w-28 h-28 flex items-center justify-center border-2 border-dashed rounded-md text-slate-400 cursor-pointer hover:bg-slate-100"
                        onClick={() => document.getElementById(`evidence-${i}`)?.click()}
                      >
                        Upload
                      </div>
                    )}

                    <input
                      id={`evidence-${i}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(i, e.target.files?.[0] || null)}
                    />
                    <p className="text-[11px] text-slate-600">
                      {existing ? existing.type.replaceAll("_", " ") : "New Evidence"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="reset" variant="outline-secondary">
              Reset / <span className="font-urdu">ری سیٹ</span>
            </Button>
            <Button type="submit" variant="primary">
              {id ? (
                <>
                  Update / <span className="font-urdu">اپ ڈیٹ</span>
                </>
              ) : (
                <>
                  Submit / <span className="font-urdu">جمع کروائیں</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}