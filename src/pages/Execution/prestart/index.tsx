import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";

// --- Dummy catalogue ---
const CREW = [
  { id: 10, name: "Ali Khan" },
  { id: 11, name: "Sara Ahmed" },
  { id: 12, name: "Bilal Hussain" },
  { id: 13, name: "Hina R." },
  { id: 14, name: "Junaid I." },
];
const PPE_ITEMS = [
  { key: "helmet", label: "Helmet" },
  { key: "gloves", label: "Insulated Gloves" },
  { key: "shoes", label: "Safety Shoes" },
  { key: "goggles", label: "Eye Protection" },
  { key: "hiviz", label: "Hi-Vis Vest" },
] as const;

// Simple dummy PTW snapshot
const SNAPSHOT: Record<string, { id: string; title: string; division: string; date: string }> = {
  "PTW-1601": { id: "PTW-1601", title: "Feeder F-101 Maintenance", division: "Gulberg Division", date: "2025-09-23" },
  "PTW-1602": { id: "PTW-1602", title: "Transformer T-55 Inspection", division: "DHA Division", date: "2025-09-24" },
  "PTW-1603": { id: "PTW-1603", title: "Line L-22 Hotspot Repair", division: "Satellite Town", date: "2025-09-22" },
};

type Sign = { userId: number; signed: boolean };

const PreStartForm = () => {
  const { ptwId } = useParams<{ ptwId: string }>();
  const snap = useMemo(() => (ptwId && SNAPSHOT[ptwId]) || Object.values(SNAPSHOT)[0], [ptwId]);
  const navigate = useNavigate();

  // Crew roster (who is on job) & toolbox talk signatures
  const [roster, setRoster] = useState<number[]>([10, 11]); // preselect some
  const [signs, setSigns] = useState<Record<number, boolean>>({ 10: false, 11: false });

  // PPE checklist
  const [ppe, setPpe] = useState<Record<string, boolean>>({
    helmet: false,
    gloves: false,
    shoes: false,
    goggles: false,
    hiviz: false,
  });

  // Evidence L2
  const [photos, setPhotos] = useState<string[]>([]);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const crewSelected = useMemo(() => CREW.filter(c => roster.includes(c.id)), [roster]);
  const signaturesComplete = crewSelected.length > 0 && crewSelected.every(c => signs[c.id]);

  const ppeComplete = PPE_ITEMS.every(p => ppe[p.key]);
  const gpsComplete = gpsLat.trim() !== "" && gpsLng.trim() !== "";
  const photosComplete = photos.length > 0;

  const validateBeforeStart = () => {
    const e: Record<string, string> = {};
    if (roster.length === 0) e.roster = "Select at least one crew member";
    if (!signaturesComplete) e.signs = "All on-roster members must sign the toolbox talk";
    if (!ppeComplete) e.ppe = "All PPE items must be checked";
    if (!photosComplete) e.photos = "At least one site photo is required";
    if (!gpsComplete) e.gps = "GPS latitude & longitude are required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onStartWork = () => {
    if (!validateBeforeStart()) return;
    alert("🚀 Work Started (dummy). Validation passed: PPE & GPS evidence OK.");
    navigate("/pre-start");
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">Pre-Start — PTW {snap.id}</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs bg-slate-100 text-slate-700">
            {snap.title} • {snap.division} • {snap.date}
          </span>
        </div>
      </div>

      {/* Left: Crew & Toolbox Talk */}
      <div className="col-span-12 xl:col-span-6">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Crew Roster</div>

          {/* Crew selection */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CREW.map(c => {
                  const checked = roster.includes(c.id);
                  return (
                    <FormCheck key={c.id}>
                      <FormCheck.Input
                        id={`crew-${c.id}`}
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          setRoster(prev =>
                            e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                          );
                          setSigns(prev => ({ ...prev, [c.id]: false })); // reset signature if toggled
                        }}
                      />
                      <FormCheck.Label htmlFor={`crew-${c.id}`}>{c.name}</FormCheck.Label>
                    </FormCheck>
                  );
                })}
              </div>
              {errors.roster && <p className="text-rose-500 text-xs mt-1">{errors.roster}</p>}
            </div>

            {/* Toolbox talk signatures */}
            <div className="col-span-12 mt-4">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Toolbox Talk Signatures</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {crewSelected.map(c => (
                  <FormCheck key={`sign-${c.id}`}>
                    <FormCheck.Input
                      id={`sign-${c.id}`}
                      type="checkbox"
                      checked={!!signs[c.id]}
                      onChange={e => setSigns(s => ({ ...s, [c.id]: e.target.checked }))}
                    />
                    <FormCheck.Label htmlFor={`sign-${c.id}`}>{c.name} — Signed</FormCheck.Label>
                  </FormCheck>
                ))}
              </div>
              {errors.signs && <p className="text-rose-500 text-xs mt-1">{errors.signs}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Right: PPE + Evidence */}
      <div className="col-span-12 xl:col-span-6">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">PPE Checklist</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PPE_ITEMS.map(item => (
              <FormCheck key={item.key}>
                <FormCheck.Input
                  id={`ppe-${item.key}`}
                  type="checkbox"
                  checked={!!ppe[item.key]}
                  onChange={e => setPpe(p => ({ ...p, [item.key]: e.target.checked }))}
                />
                <FormCheck.Label htmlFor={`ppe-${item.key}`}>{item.label}</FormCheck.Label>
              </FormCheck>
            ))}
          </div>
          {errors.ppe && <p className="text-rose-500 text-xs mt-1">{errors.ppe}</p>}

          <div className="mt-5 text-sm font-semibold text-slate-600 dark:text-slate-300">Evidence L2</div>
          <div className="grid grid-cols-12 gap-3 mt-2">
            <label className="col-span-12">
              <span className="text-xs text-slate-500">Photo URLs (comma separated) *</span>
              <textarea
                rows={2}
                className="w-full !box rounded-md p-3 text-sm"
                placeholder="https://... , https://..."
                value={photos.join(", ")}
                onChange={e =>
                  setPhotos(
                    e.target.value
                      .split(",")
                      .map(s => s.trim())
                      .filter(Boolean)
                  )
                }
              />
              {errors.photos && <p className="text-rose-500 text-xs mt-1">{errors.photos}</p>}
            </label>

            <label className="col-span-6">
              <span className="text-xs text-slate-500">GPS Lat *</span>
              <FormInput value={gpsLat} onChange={e => setGpsLat(e.target.value)} placeholder="e.g., 24.8607" />
            </label>
            <label className="col-span-6">
              <span className="text-xs text-slate-500">GPS Lng *</span>
              <FormInput value={gpsLng} onChange={e => setGpsLng(e.target.value)} placeholder="e.g., 67.0011" />
            </label>
            {errors.gps && <p className="text-rose-500 text-xs mt-1 col-span-12">{errors.gps}</p>}
          </div>

          {/* Start CTA */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="primary" onClick={onStartWork}>
              <Lucide icon="PlayCircle" className="w-4 h-4 mr-2" /> Start Work
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/execution")}>
              <Lucide icon="ArrowLeft" className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </div>

          {/* Validation preview */}
          <div className="mt-6 rounded-xl border border-slate-200/70 dark:border-darkmode-400 p-4 text-sm">
            <div className="font-semibold mb-2">Validation Summary</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crew selected: <b>{roster.length}</b></li>
              <li>Toolbox signatures complete: <b>{signaturesComplete ? "Yes" : "No"}</b></li>
              <li>PPE complete: <b>{ppeComplete ? "Yes" : "No"}</b></li>
              <li>Photos attached: <b>{photosComplete ? "Yes" : "No"}</b></li>
              <li>GPS provided: <b>{gpsComplete ? "Yes" : "No"}</b></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreStartForm;
