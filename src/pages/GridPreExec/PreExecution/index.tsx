import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";

// ----- Dummy PTW snapshot store -----
type Snapshot = {
  id: string;
  title: string;
  division: string;
  issuedAt: string;
};
const MOCK: Record<string, Snapshot> = {
  "PTW-1501": { id: "PTW-1501", title: "Feeder F-101 Maintenance", division: "Gulberg Division", issuedAt: "2025-09-23 09:00" },
  "PTW-1502": { id: "PTW-1502", title: "Transformer T-55 Inspection", division: "DHA Division", issuedAt: "2025-09-24 08:15" },
  "PTW-1503": { id: "PTW-1503", title: "Line L-22 Hotspot Repair", division: "Satellite Town", issuedAt: "2025-09-22 10:45" },
};

const GridPreExecChecklist = () => {
  const { id } = useParams<{ id: string }>();
  const snapshot = useMemo(() => (id && MOCK[id]) || Object.values(MOCK)[0], [id]);

  const navigate = useNavigate();

  // Checklist fields
  const [isolations, setIsolations] = useState(false);
  const [earthing, setEarthing] = useState(false);
  const [dangerBoards, setDangerBoards] = useState(false);
  const [barriers, setBarriers] = useState(false);
  const [cordoned, setCordoned] = useState(false);
  const [controlRoom, setControlRoom] = useState(false);
  const [special, setSpecial] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForActivate = () => {
    const e: Record<string, string> = {};
    if (!isolations) e.isolations = "Confirm isolations carried out";
    if (!earthing) e.earthing = "Confirm earthing applied";
    if (!dangerBoards) e.dangerBoards = "Confirm danger boards placed";
    if (!barriers) e.barriers = "Confirm barriers/guards in place";
    if (!cordoned) e.cordoned = "Confirm work location cordoned";
    if (!controlRoom) e.controlRoom = "Confirm control room informed";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateForFixes = () => {
    const e: Record<string, string> = {};
    if (!special.trim()) e.special = "Decision notes / special precautions are required to request fixes";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // CTAs (dummy)
  const onActivate = () => {
    if (!validateForActivate()) return;
    alert("✅ PTW Activated (dummy).");
    navigate("/grid/pre-exec");
  };
  const onRequestFixes = () => {
    if (!validateForFixes()) return;
    alert("↩️ Fixes requested from issuer (dummy).");
    navigate("/grid/pre-exec");
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">Pre-Execution Checklist</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs bg-slate-100 text-slate-700">PTW: {snapshot.id}</span>
        </div>
      </div>

      {/* Snapshot */}
      <div className="col-span-12">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="text-xl font-semibold">{snapshot.title}</div>
          <div className="text-slate-500 text-sm mt-1">
            Division: {snapshot.division} • Issued {snapshot.issuedAt}
          </div>
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Review work site preparations before activation. Ensure all isolation & safety barriers are in place.
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="col-span-12">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Checklist</div>

          <div className="space-y-2">
            <FormCheck>
              <FormCheck.Input id="gi-iso" type="checkbox" checked={isolations} onChange={e => setIsolations(e.target.checked)} />
              <FormCheck.Label htmlFor="gi-iso">Isolations carried out</FormCheck.Label>
            </FormCheck>
            {errors.isolations && <p className="text-rose-500 text-xs -mt-1 mb-2">{errors.isolations}</p>}

            <FormCheck>
              <FormCheck.Input id="gi-earth" type="checkbox" checked={earthing} onChange={e => setEarthing(e.target.checked)} />
              <FormCheck.Label htmlFor="gi-earth">Earthing applied</FormCheck.Label>
            </FormCheck>
            {errors.earthing && <p className="text-rose-500 text-xs -mt-1 mb-2">{errors.earthing}</p>}

            <FormCheck>
              <FormCheck.Input id="gi-danger" type="checkbox" checked={dangerBoards} onChange={e => setDangerBoards(e.target.checked)} />
              <FormCheck.Label htmlFor="gi-danger">Danger boards placed</FormCheck.Label>
            </FormCheck>
            {errors.dangerBoards && <p className="text-rose-500 text-xs -mt-1 mb-2">{errors.dangerBoards}</p>}

            <FormCheck>
              <FormCheck.Input id="gi-barriers" type="checkbox" checked={barriers} onChange={e => setBarriers(e.target.checked)} />
              <FormCheck.Label htmlFor="gi-barriers">Barriers / guards in place</FormCheck.Label>
            </FormCheck>
            {errors.barriers && <p className="text-rose-500 text-xs -mt-1 mb-2">{errors.barriers}</p>}

            <FormCheck>
              <FormCheck.Input id="gi-cordoned" type="checkbox" checked={cordoned} onChange={e => setCordoned(e.target.checked)} />
              <FormCheck.Label htmlFor="gi-cordoned">Work location cordoned</FormCheck.Label>
            </FormCheck>
            {errors.cordoned && <p className="text-rose-500 text-xs -mt-1 mb-2">{errors.cordoned}</p>}

            <FormCheck>
              <FormCheck.Input id="gi-cr" type="checkbox" checked={controlRoom} onChange={e => setControlRoom(e.target.checked)} />
              <FormCheck.Label htmlFor="gi-cr">Control room informed</FormCheck.Label>
            </FormCheck>
            {errors.controlRoom && <p className="text-rose-500 text-xs -mt-1 mb-2">{errors.controlRoom}</p>}
          </div>

          <label className="block mt-4">
            <span className="text-xs text-slate-500">Special precautions / notes</span>
            <textarea
              rows={4}
              className="w-full !box rounded-md p-3 text-sm"
              placeholder="Note any site-specific risks, abnormal configurations, weather concerns, public proximity, etc."
              value={special}
              onChange={e => setSpecial(e.target.value)}
            />
            {errors.special && <p className="text-rose-500 text-xs mt-1">{errors.special}</p>}
          </label>

          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="primary" onClick={onActivate}>
              <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Confirm & Activate PTW
            </Button>
            <Button variant="outline-danger" onClick={onRequestFixes}>
              <Lucide icon="Undo2" className="w-4 h-4 mr-2" /> Request Fixes
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/grid/pre-exec")}>
              <Lucide icon="ArrowLeftRight" className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </div>

          {/* Quick Preview */}
          <div className="mt-6 rounded-xl border border-slate-200/70 dark:border-darkmode-400 p-4 text-sm">
            <div className="font-semibold mb-2">Preview</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Isolations: <b>{isolations ? "Yes" : "No"}</b></li>
              <li>Earthing: <b>{earthing ? "Yes" : "No"}</b></li>
              <li>Danger Boards: <b>{dangerBoards ? "Yes" : "No"}</b></li>
              <li>Barriers: <b>{barriers ? "Yes" : "No"}</b></li>
              <li>Cordoned: <b>{cordoned ? "Yes" : "No"}</b></li>
              <li>Control Room: <b>{controlRoom ? "Yes" : "No"}</b></li>
              <li>Notes: <b>{special || "—"}</b></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridPreExecChecklist;
