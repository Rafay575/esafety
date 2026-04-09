"use client";
import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader } from "lucide-react";

// ---------- Types ----------
type Feeder = { id: number; name: string; code: string };
type Transformer = {
  id: number;
  transformer_id: string;
  transformer_ref_no: string;
};
type TeamMember = { id: number; name: string; avatar_url: string };
type PtwType = "MISC" | "PLANNED" | "EMERGENCY";

// ---------- Zod validation schema ----------
const formSchema = z.object({
  current_date: z.string(),
  type: z.enum(["MISC", "PLANNED", "EMERGENCY"]),
  misc_type: z.string().optional(),
  reference_no: z.string().optional(),
  circuit_type: z.enum(["SINGLE", "MULTI"]),
  sub_division_id: z.string(),
  feeder_id: z.string().min(1, "Primary feeder is required"),
  secondary_feeder_ids: z.array(z.number()).default([]),
  is_ptw_required: z.enum(["YES", "NO"]),
  planned_from_date: z.string().optional(),
  planned_to_date: z.string().optional(),
  planned_schedule: z.array(z.any()).default([]),
  transformer_id: z.string().min(1, "Transformer is required"),
  feeder_incharge_name: z.string().min(1, "Feeder incharge name is required"),
  location_text: z.string(),
  location_lat: z.string(),
  location_lng: z.string(),
  place_of_work: z.string().min(1, "Place of work is required"),
  scope_of_work: z.string().min(1, "Scope of work is required"),
  safety_arrangements: z.string().min(1, "Safety arrangements are required"),
  scheduled_start_at: z.string().optional(),
  estimated_duration_min: z
    .string()
    .min(1, "Duration is required")
    .refine((val) => Number(val) >= 15, "Duration must be at least 15 minutes"),
  switch_off_time: z.string().min(1, "Switch off time is required"),
  restore_time: z.string().min(1, "Restore time is required"),
  team_member_ids: z.array(z.number()).default([]),
});

type FormData = z.infer<typeof formSchema>;

const getGoogleMapsApiKey = (): string => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  ) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
  console.error(
    "Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY",
  );
  return "";
};

const mapContainerStyle = { width: "100%", height: "300px" };
const defaultCenter = { lat: 33.6844, lng: 73.0479 }; // fallback (Islamabad)

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
  const [previewNames, setPreviewNames] = useState<{
    feederName?: string;
    transformerName?: string;
  }>({});

  // ---------- React Hook Form ----------
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_date: new Date().toISOString().split("T")[0],
      type: "MISC",
      misc_type: "",
      reference_no: "",
      circuit_type: "SINGLE",
      sub_division_id: "",
      feeder_id: "",
      secondary_feeder_ids: [],
      is_ptw_required: "YES",
      planned_from_date: "",
      planned_to_date: "",
      planned_schedule: [],
      transformer_id: "",
      feeder_incharge_name: "",
      location_text: "",
      location_lat: "",
      location_lng: "",
      place_of_work: "",
      scope_of_work: "",
      safety_arrangements: "",
      scheduled_start_at: "",
      estimated_duration_min: "",
      switch_off_time: "",
      restore_time: "",
      team_member_ids: [],
    },
  });

  // Watch values needed for conditional logic
  const watchType = watch("type");
  const watchIsPtwRequired = watch("is_ptw_required");
  const watchCircuitType = watch("circuit_type");
  const watchFeederId = watch("feeder_id");
  const watchPlannedSchedule = watch("planned_schedule");

  // ---------- Google Maps state ----------
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ["places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Local marker state (syncs with form)
  const [markerPosition, setMarkerPosition] = useState(() => {
    const lat = watch("location_lat");
    const lng = watch("location_lng");
    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    return defaultCenter;
  });
  const [address, setAddress] = useState(watch("location_text"));

  // Update marker when form lat/lng change (e.g., from auto-fetch)
  useEffect(() => {
    const lat = watch("location_lat");
    const lng = watch("location_lng");
    if (lat && lng) {
      setMarkerPosition({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  }, [watch("location_lat"), watch("location_lng")]);

  // ---------- Google Maps initialisation ----------
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Auto‑fetch location when map loads (only for new PTWs and if fields are empty)
  useEffect(() => {
    if (!isLoaded || !map || !geocoderRef.current) return;
    if (id) return; // skip for existing PTWs
    if (watch("location_lat") && watch("location_lng") && watch("location_text")) return;

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
                setValue("location_lat", latitude.toFixed(6));
                setValue("location_lng", longitude.toFixed(6));
                setValue("location_text", address);
                toast.success("📍 Location auto-fetched");
              } else {
                // fallback to coordinates
                const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setAddress(fallback);
                setValue("location_lat", latitude.toFixed(6));
                setValue("location_lng", longitude.toFixed(6));
                setValue("location_text", fallback);
              }
            },
          );
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.error(
            "Unable to fetch your location. You can drag the marker to set it.",
          );
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported by this browser");
    }
  }, [isLoaded, map, id, watch("location_lat"), watch("location_lng"), watch("location_text")]);

  // Marker drag handler
  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === "OK" && results?.[0]) {
              const newAddress = results[0].formatted_address;
              setAddress(newAddress);
              setValue("location_lat", lat.toFixed(6));
              setValue("location_lng", lng.toFixed(6));
              setValue("location_text", newAddress);
            } else {
              const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
              setAddress(fallback);
              setValue("location_lat", lat.toFixed(6));
              setValue("location_lng", lng.toFixed(6));
              setValue("location_text", fallback);
            }
          },
        );
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
    const input = document.getElementById(
      "map-search-input",
    ) as HTMLInputElement;
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
      setValue("location_lat", lat.toFixed(6));
      setValue("location_lng", lng.toFixed(6));
      setValue("location_text", place.formatted_address || "");
      map.panTo({ lat, lng });
      map.setZoom(15);
    });

    return () => google.maps.event.clearInstanceListeners(autocomplete);
  }, [isLoaded, map, setValue]);

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

        setValue("sub_division_id", sdId);

        if (id) {
          const { data } = await api.get(`/api/v1/ptw/${id}/preview`);
          const p = data?.data?.ptw;

          setPreviewNames({
            feederName: p?.feeder_name ?? undefined,
            transformerName: p?.transformer_name ?? undefined,
          });

          // Set all form values from preview
          setValue("type", p?.type || "MISC");
          setValue("misc_type", p?.misc_type || "");
          setValue("reference_no", p?.reference_no || "");
          setValue("circuit_type", p?.circuit_type || "SINGLE");
          setValue("is_ptw_required", p?.is_ptw_required || "YES");
          setValue("feeder_incharge_name", p?.feeder_incharge_name || "");
          setValue("place_of_work", p?.place_of_work || "");
          setValue("scope_of_work", p?.scope_of_work || "");
          setValue("safety_arrangements", p?.safety_arrangements || "");
          setValue(
            "scheduled_start_at",
            p?.scheduled_start_at ? String(p.scheduled_start_at).replace(" ", "T") : "",
          );
          setValue(
            "estimated_duration_min",
            p?.estimated_duration_min != null ? String(p.estimated_duration_min) : "",
          );
          setValue("switch_off_time", p?.switch_off_time || "");
          setValue("restore_time", p?.restore_time || "");
          setValue("location_text", p?.location || "");
          setValue("location_lat", p?.location_lat || "");
          setValue("location_lng", p?.location_lng || "");
          setValue("planned_from_date", p?.planned_from_date || "");
          setValue("planned_to_date", p?.planned_to_date || "");
          setValue(
            "planned_schedule",
            Array.isArray(p?.planned_schedule) ? (p.planned_schedule as PlannedScheduleRow[]) : [],
          );
          setValue(
            "team_member_ids",
            Array.isArray(p?.team_members) ? p.team_members.map((m: { id: number }) => m.id) : [],
          );

          // Evidences are handled separately (state below)
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
  }, [id, setValue]);

  // ---------- Circuit rules ----------
  useEffect(() => {
    if (watchCircuitType === "SINGLE") {
      setValue("secondary_feeder_ids", []);
    }
  }, [watchCircuitType, setValue]);

  useEffect(() => {
    const isMiscNoPtw = watchType === "MISC" && watchIsPtwRequired === "NO";
    if (isMiscNoPtw) {
      setValue("circuit_type", "SINGLE");
      setValue("secondary_feeder_ids", []);
    }
  }, [watchType, watchIsPtwRequired, setValue]);

  // Auto-select first primary feeder on SINGLE
  useEffect(() => {
    if (watchCircuitType !== "SINGLE") return;
    if (watchFeederId) return;
    if (!context.primary_feeders.length) return;

    setValue("feeder_id", String(context.primary_feeders[0].id));
  }, [watchCircuitType, context.primary_feeders, watchFeederId, setValue]);

  // Resolve preview feeder name -> feeder_id
  useEffect(() => {
    if (!previewNames.feederName || !context.primary_feeders?.length) return;
    if (watchFeederId) return;

    const match = context.primary_feeders.find(
      (f) => f.name === previewNames.feederName,
    );
    if (match) setValue("feeder_id", String(match.id));
  }, [previewNames.feederName, context.primary_feeders, watchFeederId, setValue]);

  // Fetch transformers when feeder changes
  useEffect(() => {
    const fetchTransformers = async () => {
      if (!watchFeederId) {
        setTransformers([]);
        setValue("transformer_id", "");
        return;
      }
      try {
        const res = await api.get(
          `/api/v1/meta/related?feeder_id=${watchFeederId}`,
        );
        const list: Transformer[] = res.data.lists?.transformers || [];
        setTransformers(list);
      } catch {
        toast.error("Failed to load transformers");
        setTransformers([]);
      }
    };
    fetchTransformers();
  }, [watchFeederId, setValue]);

  // Resolve preview transformer name -> transformer_id
  useEffect(() => {
    if (!previewNames.transformerName || !transformers.length) return;
    const currentTransId = watch("transformer_id");
    if (currentTransId) return;

    const match = transformers.find(
      (t) => t.transformer_id === previewNames.transformerName,
    );
    if (match) setValue("transformer_id", String(match.id));
  }, [previewNames.transformerName, transformers, watch, setValue]);

  // ---------- Evidence state (kept separate because files) ----------
  const [evidences, setEvidences] = useState<(File | null)[]>([null, null, null, null, null]);
  const [existingEvidences, setExistingEvidences] = useState<
    { id: number; file_path: string; type: string }[]
  >([]);

  const handleFileChange = (i: number, file: File | null) => {
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error(`File "${file.name}" exceeds 2MB limit.`);
      return;
    }
    setEvidences((prev) => {
      const newEv = [...prev];
      newEv[i] = file;
      return newEv;
    });
  };

  // Load existing evidences from preview
  useEffect(() => {
    if (id) {
      const loadExisting = async () => {
        try {
          const { data } = await api.get(`/api/v1/ptw/${id}/preview`);
          const p = data?.data?.ptw;
          if (Array.isArray(p?.evidences)) {
            setExistingEvidences(p.evidences);
          }
        } catch (error) {
          console.error("Failed to load existing evidences", error);
        }
      };
      loadExisting();
    }
  }, [id]);

  // ---------- Type handler (PLANNED => open modal) ----------
  const handleTypeChange = (val: string) => {
    const nextType = val as PtwType;
    setValue("type", nextType);
    if (nextType === "PLANNED") {
      setPlannedOpen(true);
    } else {
      setValue("planned_from_date", "");
      setValue("planned_to_date", "");
      setValue("planned_schedule", []);
    }
  };

  // ---------- Submit handler ----------
  const onSubmit = async (data: FormData) => {
    // planned validation
    if (data.type === "PLANNED") {
      if (
        !data.planned_from_date ||
        !data.planned_to_date ||
        !data.planned_schedule?.length
      ) {
        toast.error("Please complete the planned schedule.");
        setPlannedOpen(true);
        return;
      }
    }
    if (data.type === "MISC") {
      if (!data.misc_type) {
        toast.error("Please select Misc Type.");
        return;
      }
      if (!data.reference_no?.trim()) {
        toast.error("Please enter Reference Number.");
        return;
      }
    }

    // Log the entire form state for debugging
    console.log("📋 Form State on Submit:", { ...data, evidences, existingEvidences });

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
    ).forEach((k) => fd.append(k, String((data as any)[k] ?? "")));

    fd.set("switch_off_time", formatTime(data.switch_off_time));
    fd.set("restore_time", formatTime(data.restore_time));

    // planned payload
    if (data.type === "PLANNED") {
      fd.append("planned_from_date", String(data.planned_from_date || ""));
      fd.append("planned_to_date", String(data.planned_to_date || ""));

      (data.planned_schedule || []).forEach((row, idx) => {
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
    (data.team_member_ids as number[]).forEach((tmId) =>
      fd.append("team_member_ids[]", String(tmId)),
    );

    // secondary feeders (only for MULTI)
    if (data.circuit_type === "MULTI") {
      (data.secondary_feeder_ids as number[]).forEach((fid) =>
        fd.append("secondary_feeder_ids[]", String(fid)),
      );
    }

    // evidences
    evidences.forEach((f, i) => {
      if (f) {
        fd.append(`evidences[${i}][type]`, "SITE_BEFORE_SHUTDOWN");
        fd.append(`evidences[${i}][file]`, f);
      }
    });

    // Log FormData entries (converting to object for readability)
    const formDataObj: any = {};
    fd.forEach((value, key) => {
      if (formDataObj[key]) {
        if (!Array.isArray(formDataObj[key])) {
          formDataObj[key] = [formDataObj[key]];
        }
        formDataObj[key].push(value);
      } else {
        formDataObj[key] = value;
      }
    });
    console.log("📎 FormData to be sent:", formDataObj);

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
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save PTW data");
      next();
    }
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Items for search selects
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
  const teamItems: SearchSelectItem[] = context.team_members.map((m) => ({
    id: m.id,
    label: m.name,
  }));

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        <Loader className="animate-spin" size={48} />
      </div>
    );

  const hideSecondaryForMiscNoPtw =
    watchType === "MISC" && watchIsPtwRequired === "NO";

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 border-b bg-white/80 backdrop-blur-sm z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-800">
            PTW — Basic Information /{" "}
            <span className="font-urdu">بنیادی معلومات</span>
          </h1>
          <p className="text-xs text-slate-500">
            {id ? `Editing Permit #${id}` : "Create New Permit"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-6xl px-6 pt-6 pb-24 space-y-6"
      >
        <PlannedScheduleModal
          open={plannedOpen}
          onClose={() => {
            setPlannedOpen(false);
            // If planned schedule is incomplete, revert to MISC
            if (
              watchType === "PLANNED" &&
              (!watch("planned_from_date") ||
                !watch("planned_to_date") ||
                !watchPlannedSchedule?.length)
            ) {
              setValue("type", "MISC");
            }
          }}
          initialFrom={watch("planned_from_date") || undefined}
          initialTo={watch("planned_to_date") || undefined}
          initialSchedule={watchPlannedSchedule || undefined}
          onSave={({ planned_from_date, planned_to_date, planned_schedule }) => {
            setValue("planned_from_date", planned_from_date);
            setValue("planned_to_date", planned_to_date);
            setValue("planned_schedule", planned_schedule);
          }}
        />

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>
                Current Date / <span className="font-urdu">تاریخ</span>
              </FormLabel>
              <FormInput
                value={watch("current_date")}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div>
              <FormLabel>
                Sub Division / <span className="font-urdu">سب ڈویژن</span>
              </FormLabel>
              <FormInput
                value={context.sub_division?.name || ""}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div>
              <FormLabel>
                Type / <span className="font-urdu">قسم</span>
              </FormLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    required
                    value={field.value}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    <option value="MISC">MISC</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </FormSelect>
                )}
              />
            </div>

            {/* Planned Summary Card */}
            {watchType === "PLANNED" ? (
              <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      Planned Window
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {watch("planned_from_date") && watch("planned_to_date")
                        ? `${watch("planned_from_date")} → ${watch("planned_to_date")}`
                        : "Not set"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Days: {watchPlannedSchedule?.length || 0}
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
                {!watchPlannedSchedule?.length ? (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Schedule not set yet. Please click “Edit Schedule”.
                  </div>
                ) : null}
              </div>
            ) : null}

            {watchType === "MISC" && (
              <div className="col-span-2">
                <FormLabel>
                  PTW Required? /{" "}
                  <span className="font-urdu">پی ٹی ڈبلیو ضروری ہے؟</span>
                </FormLabel>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="YES"
                      checked={watchIsPtwRequired === "YES"}
                      onChange={() => setValue("is_ptw_required", "YES")}
                    />
                    <span>
                      Yes / <span className="font-urdu">ہاں</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="NO"
                      checked={watchIsPtwRequired === "NO"}
                      onChange={() => setValue("is_ptw_required", "NO")}
                    />
                    <span>
                      No / <span className="font-urdu">نہیں</span>
                    </span>
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
                    value="SINGLE"
                    checked={watchCircuitType === "SINGLE"}
                    onChange={() => setValue("circuit_type", "SINGLE")}
                    disabled={hideSecondaryForMiscNoPtw}
                  />
                  <span>
                    Single Circuit /{" "}
                    <span className="font-urdu">سنگل سرکٹ</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="MULTI"
                    checked={watchCircuitType === "MULTI"}
                    onChange={() => setValue("circuit_type", "MULTI")}
                    disabled={hideSecondaryForMiscNoPtw}
                  />
                  <span>
                    Multi Circuit / <span className="font-urdu">ملٹی سرکٹ</span>
                  </span>
                </label>
              </div>
              {hideSecondaryForMiscNoPtw ? (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  Secondary feeders disabled because PTW Required is <b>NO</b>{" "}
                  in MISC.
                </div>
              ) : null}
            </div>

            {watchType === "MISC" && (
              <>
                <div>
                  <FormLabel>
                    Misc Type / <span className="font-urdu">متفرق نوعیت</span>
                  </FormLabel>
                  <Controller
                    name="misc_type"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        required
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="">Select Misc Type</option>
                        <option value="MCO">MCO</option>
                        <option value="SCO">SCO</option>
                        <option value="RCO">RCO</option>
                        <option value="DCO">DCO</option>
                        <option value="COMPLAINT">COMPLAINT</option>
                      </FormSelect>
                    )}
                  />
                </div>
                <div>
                  <FormLabel>
                    {watch("misc_type")} No /{" "}
                    <span className="font-urdu">ریفرنس نمبر</span>
                  </FormLabel>
                  <Controller
                    name="reference_no"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        required
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter reference number"
                      />
                    )}
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
            <Controller
              name="feeder_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  items={feederItems}
                  value={field.value ? Number(field.value) : null}
                  onChange={(val) => field.onChange(val ? String(val) : "")}
                  required
                  // error={errors.feeder_id?.message}
                />
              )}
            />
          </div>

          {/* Secondary Feeders - MULTI only */}
          {watchCircuitType === "MULTI" && !hideSecondaryForMiscNoPtw && (
            <div>
              <FormLabel>
                Secondary Feeders /{" "}
                <span className="font-urdu">سیکنڈری فیڈرز</span>
              </FormLabel>
              <Controller
                name="secondary_feeder_ids"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    multi
                    items={secondaryItems}
                    values={field.value}
                    onChangeMulti={(vals) => field.onChange(vals)}
                  />
                )}
              />
            </div>
          )}

          {/* Transformer */}
          <div>
            <FormLabel>
              Transformer / <span className="font-urdu">ٹرانسفارمر</span>
            </FormLabel>
            <Controller
              name="transformer_id"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  items={transformers.map((t) => ({
                    id: t.id,
                    label: `${t.transformer_id} — ${t.transformer_ref_no}`,
                  }))}
                  value={field.value ? Number(field.value) : null}
                  onChange={(val) => field.onChange(val ? String(val) : "")}
                  disabled={!watchFeederId}
                  required
                  placeholder={
                    watchFeederId
                      ? transformers.length
                        ? "Select Transformer"
                        : "No transformers found"
                      : "Select Feeder first"
                  }
                  // error={errors.transformer_id?.message}
                />
              )}
            />
          </div>

          {/* Times and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FormLabel>
                Switch Off Time / <span className="font-urdu">بجلی بند</span>
              </FormLabel>
              <Controller
                name="switch_off_time"
                control={control}
                render={({ field }) => (
                  <FormInput
                    required
                    type="time"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel>
                Restore Time / <span className="font-urdu">بحالی</span>
              </FormLabel>
              <Controller
                name="restore_time"
                control={control}
                render={({ field }) => (
                  <FormInput
                    required
                    type="time"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel>
                Duration (Minutes) / <span className="font-urdu">دورانیہ</span>
              </FormLabel>
              <Controller
                name="estimated_duration_min"
                control={control}
                render={({ field }) => (
                  <FormInput
                    required
                    type="number"
                    min="15"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.estimated_duration_min && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.estimated_duration_min.message}
                </p>
              )}
            </div>
          </div>

          {/* Feeder Incharge */}
          <div>
            <FormLabel>
              Feeder Incharge / <span className="font-urdu">فیڈر انچارج</span>
            </FormLabel>
            <Controller
              name="feeder_incharge_name"
              control={control}
              render={({ field }) => (
                <FormInput
                  required
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.feeder_incharge_name && (
              <p className="text-xs text-red-500 mt-1">
                {errors.feeder_incharge_name.message}
              </p>
            )}
          </div>

          {/* Place of Work */}
          <div>
            <FormLabel>
              Place of Work / <span className="font-urdu">کام کی جگہ</span>
            </FormLabel>
            <Controller
              name="place_of_work"
              control={control}
              render={({ field }) => (
                <FormInput
                  required
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter place of work"
                />
              )}
            />
            {errors.place_of_work && (
              <p className="text-xs text-red-500 mt-1">
                {errors.place_of_work.message}
              </p>
            )}
          </div>

          {/* ---------- Location Section with Inline Map ---------- */}
          <div>
            <FormLabel>
              Location / <span className="font-urdu">مقام</span>
            </FormLabel>

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
                <Marker
                  position={markerPosition}
                  draggable
                  onDragEnd={onMarkerDragEnd}
                />
              </GoogleMap>
            )}

            {/* Address and coordinates (read-only) */}
            <div className="mt-3 grid grid-cols-1 gap-2">
              <FormInput
                value={watch("location_text")}
                readOnly
                className="bg-gray-100"
                placeholder="Address will appear here"
              />
              <div className="grid grid-cols-2 gap-2">
                <FormInput
                  value={watch("location_lat")}
                  readOnly
                  className="bg-gray-100"
                  placeholder="Latitude"
                />
                <FormInput
                  value={watch("location_lng")}
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
                            setValue("location_lat", latitude.toFixed(6));
                            setValue("location_lng", longitude.toFixed(6));
                            setValue("location_text", address);
                          } else {
                            const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                            setAddress(fallback);
                            setValue("location_lat", latitude.toFixed(6));
                            setValue("location_lng", longitude.toFixed(6));
                            setValue("location_text", fallback);
                          }
                        },
                      );
                    },
                    () => toast.error("Unable to get your location"),
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
            <Controller
              name="team_member_ids"
              control={control}
              render={({ field }) => (
                <SearchSelect
                  multi
                  items={teamItems}
                  values={field.value}
                  onChangeMulti={(vals) => field.onChange(vals)}
                  placeholder="Select team members..."
                />
              )}
            />
          </div>

          {/* Scope of Work */}
          <div>
            <FormLabel>
              Description / Scope of Work{" "}
              <span className="font-urdu">کام کی تفصیل</span>
            </FormLabel>
            <Controller
              name="scope_of_work"
              control={control}
              render={({ field }) => (
                <FormTextarea
                  required
                  rows={3}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.scope_of_work && (
              <p className="text-xs text-red-500 mt-1">
                {errors.scope_of_work.message}
              </p>
            )}
          </div>

          {/* Safety Arrangements */}
          <div>
            <FormLabel>
              Safety Arrangements /{" "}
              <span className="font-urdu">حفاظتی انتظامات</span>
            </FormLabel>
            <Controller
              name="safety_arrangements"
              control={control}
              render={({ field }) => (
                <FormTextarea
                  required
                  rows={3}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.safety_arrangements && (
              <p className="text-xs text-red-500 mt-1">
                {errors.safety_arrangements.message}
              </p>
            )}
          </div>

          {/* Evidence Photos - now with 5 slots */}
          <div>
            <FormLabel>
              Evidence Photos (max 5, 2MB each) /{" "}
              <span className="font-urdu">شواہد</span>
            </FormLabel>
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 5 }).map((_, i) => {
                const existing = existingEvidences?.[i];
                const file = evidences[i];

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
                      {existing
                        ? existing.type.replaceAll("_", " ")
                        : file
                          ? file.name.length > 20
                            ? file.name.substring(0, 17) + "..."
                            : file.name
                          : `Slot ${i + 1}`}
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