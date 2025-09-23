import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";

// In a real app, fetch this by ID. Using local dummy snapshot:
type RiskBand = "Low" | "Medium" | "High";
type Snapshot = {
  id: string;
  title: string;
  category: string;
  org: {
    region: string;
    division: string;
    feeder?: string;
    assetType?: string;
    assetId?: string;
    gps?: { lat?: string; lng?: string };
  };
  risk: {
    likelihood: number;
    severity: number;
    score: number;
    band: RiskBand;
  };
  switchPlans: { name: string; steps: string[] }[];
  team: { lead: string; members: string[] };
  evidence: { photos: string[]; ts?: string; gps?: { lat?: string; lng?: string } };
  submittedAt: string;
  ls: string; // Line Superintendent
  status: "Submitted" | "On Hold" | "Cancelled" | "Changes Requested" | "Forwarded to XEN";
};

const MOCK: Record<string, Snapshot> = {
  "PTW-1001": {
    id: "PTW-1001",
    title: "Feeder F-101 Maintenance",
    category: "Maintenance",
    org: {
      region: "North Region",
      division: "Gulberg Division",
      feeder: "F-101",
      assetType: "Feeder",
      assetId: "F-101",
      gps: { lat: "31.5204", lng: "74.3587" },
    },
    risk: { likelihood: 3, severity: 5, score: 15, band: "High" },
    switchPlans: [{ name: "Plan A", steps: ["Isolate feeder", "Test absence of voltage", "Install earths"] }],
    team: { lead: "Ali Khan", members: ["Sara Ahmed", "Bilal Hussain"] },
    evidence: { photos: ["https://picsum.photos/seed/1/600/350"], ts: "2025-09-23T08:30", gps: { lat: "31.5204", lng: "74.3587" } },
    submittedAt: "2025-09-23 08:40",
    ls: "Ali Khan",
    status: "Submitted",
  },
  "PTW-1002": {
    id: "PTW-1002",
    title: "Transformer T-55 Inspection",
    category: "Inspection",
    org: {
      region: "South Region",
      division: "DHA Division",
      feeder: "F-201",
      assetType: "Transformer",
      assetId: "T-55",
    },
    risk: { likelihood: 2, severity: 3, score: 6, band: "Low" },
    switchPlans: [{ name: "Basic Check", steps: ["Visual inspection", "IR scan", "Oil test"] }],
    team: { lead: "Junaid I.", members: ["Hina R."] },
    evidence: { photos: ["https://picsum.photos/seed/2/600/350"], ts: "2025-09-23T09:00" },
    submittedAt: "2025-09-23 09:15",
    ls: "Junaid I.",
    status: "Submitted",
  },
};

const riskPill = (band: RiskBand) =>
  band === "High"
    ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800"
    : band === "Medium"
    ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800";

const SdoPtwReview = () => {
  const { id } = useParams<{ id: string }>();
  const ptw = useMemo(() => (id && MOCK[id]) || Object.values(MOCK)[0], [id]);
  const navigate = useNavigate();

  const [decisionNotes, setDecisionNotes] = useState("");
  const [workingStatus, setWorkingStatus] = useState(ptw.status);

  // Simple guard for required notes
  const notesRequired = (action: "hold" | "cancel" | "changes") => {
    if (!decisionNotes.trim()) {
      alert("Decision Notes are required for Hold / Cancel / Request Changes.");
      return true;
    }
    return false;
  };

  const onForward = () => {
    setWorkingStatus("Forwarded to XEN");
    alert("✅ Forwarded to XEN (dummy).");
    navigate("/sdo/ptw");
  };
  const onHold = () => {
    if (notesRequired("hold")) return;
    setWorkingStatus("On Hold");
    alert("⏸️ Put On Hold (dummy).");
    navigate("/sdo/ptw");
  };
  const onCancel = () => {
    if (notesRequired("cancel")) return;
    setWorkingStatus("Cancelled");
    alert("❌ Cancelled (dummy).");
    navigate("/sdo/ptw");
  };
  const onRequestChanges = () => {
    if (notesRequired("changes")) return;
    setWorkingStatus("Changes Requested");
    alert("📝 Changes requested (dummy).");
    navigate("/sdo/ptw");
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">SDO – Review PTW</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs bg-slate-100 text-slate-700">PTW: {ptw.id}</span>
          <span className={`px-3 py-1 rounded text-xs ring-1 ring-inset ${riskPill(ptw.risk.band)}`}>
            Risk: {ptw.risk.band} ({ptw.risk.score})
          </span>
        </div>
      </div>

      {/* PTW Snapshot */}
      <div className="col-span-12 xl:col-span-8">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xl font-semibold">{ptw.title}</div>
              <div className="text-slate-500 text-sm">
                {ptw.category} • Submitted {ptw.submittedAt}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">LS</div>
              <div className="font-medium">{ptw.ls}</div>
            </div>
          </div>

          {/* Org */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Organization</div>
            <div className="grid grid-cols-12 gap-3 text-sm">
              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <div className="text-slate-500">Region</div>
                <div className="font-medium">{ptw.org.region}</div>
              </div>
              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <div className="text-slate-500">Division</div>
                <div className="font-medium">{ptw.org.division}</div>
              </div>
              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <div className="text-slate-500">Feeder</div>
                <div className="font-medium">{ptw.org.feeder || "-"}</div>
              </div>
              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <div className="text-slate-500">Asset</div>
                <div className="font-medium">{ptw.org.assetType || "-"} {ptw.org.assetId ? `• ${ptw.org.assetId}` : ""}</div>
              </div>
              {ptw.org.gps?.lat && ptw.org.gps?.lng && (
                <div className="col-span-12">
                  <div className="text-slate-500">GPS</div>
                  <div className="font-medium">{ptw.org.gps.lat}, {ptw.org.gps.lng}</div>
                </div>
              )}
            </div>
          </div>

          {/* Risk */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Risk</div>
            <div className="grid grid-cols-12 gap-3 text-sm">
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Likelihood</div>
                <div className="font-medium">{ptw.risk.likelihood}</div>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Severity</div>
                <div className="font-medium">{ptw.risk.severity}</div>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Score</div>
                <div className="font-medium">{ptw.risk.score} ({ptw.risk.band})</div>
              </div>
            </div>
          </div>

          {/* Switch Plan */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Switch Plan</div>
            {ptw.switchPlans.length === 0 ? (
              <div className="text-sm text-slate-500">No switch plan attached.</div>
            ) : (
              <div className="space-y-3">
                {ptw.switchPlans.map((sp, i) => (
                  <div key={i} className="rounded-xl border border-slate-200/70 dark:border-darkmode-400 p-3">
                    <div className="font-medium mb-2">{sp.name || `Plan ${i + 1}`}</div>
                    <ol className="list-decimal pl-5 space-y-1 text-sm">
                      {sp.steps.map((st, j) => (
                        <li key={j}>{st}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Team</div>
            <div className="grid grid-cols-12 gap-3 text-sm">
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Crew Lead</div>
                <div className="font-medium">{ptw.team.lead}</div>
              </div>
              <div className="col-span-12 sm:col-span-8">
                <div className="text-slate-500">Members</div>
                <div className="font-medium">{ptw.team.members.join(", ") || "-"}</div>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Evidence</div>
            <div className="grid grid-cols-12 gap-3 text-sm">
              {ptw.evidence.ts && (
                <div className="col-span-12 sm:col-span-4">
                  <div className="text-slate-500">Timestamp</div>
                  <div className="font-medium">{ptw.evidence.ts}</div>
                </div>
              )}
              {ptw.evidence.gps?.lat && ptw.evidence.gps?.lng && (
                <div className="col-span-12 sm:col-span-4">
                  <div className="text-slate-500">GPS</div>
                  <div className="font-medium">{ptw.evidence.gps.lat}, {ptw.evidence.gps.lng}</div>
                </div>
              )}
              <div className="col-span-12">
                <div className="text-slate-500">Photos</div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {ptw.evidence.photos.length === 0 && <span className="text-slate-500">No photos</span>}
                  {ptw.evidence.photos.map((p, i) => (
                    <img
                      key={i}
                      src={p}
                      alt={`evidence-${i}`}
                      className="h-28 w-auto rounded-lg border border-slate-200/70 dark:border-darkmode-400 object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Pane */}
      <div className="col-span-12 xl:col-span-4">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Decision</div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">Current: {workingStatus}</span>
          </div>

          <label className="block">
            <span className="text-xs text-slate-500">Decision Notes</span>
            <textarea
              rows={5}
              className="w-full !box rounded-md p-3 text-sm"
              placeholder="Add your review notes / reasons. Required for Hold, Cancel, Request Changes."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="primary" onClick={onForward}>
              <Lucide icon="Send" className="w-4 h-4 mr-2" /> Forward to XEN
            </Button>
            <Button variant="outline-secondary" onClick={onHold}>
              <Lucide icon="PauseCircle" className="w-4 h-4 mr-2" /> Hold
            </Button>
            <Button variant="outline-danger" onClick={onCancel}>
              <Lucide icon="XOctagon" className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button variant="outline-primary" onClick={onRequestChanges}>
              <Lucide icon="NotebookPen" className="w-4 h-4 mr-2" /> Request Changes
            </Button>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            <div className="font-medium mb-1">Rules</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Decision Notes are required for Hold / Cancel / Request Changes.</li>
              <li>Forward to XEN does not require notes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SdoPtwReview;
