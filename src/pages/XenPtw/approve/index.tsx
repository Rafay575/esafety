import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";

type RiskBand = "Low" | "Medium" | "High";

// Snapshot + History types
type Snapshot = {
  id: string;
  title: string;
  category: "Maintenance" | "Emergency" | "Inspection" | "Upgrade";
  org: {
    region: string;
    division: string;
    feeder?: string;
    assetType?: string;
    assetId?: string;
  };
  risk: { score: number; band: RiskBand; likelihood: number; severity: number };
  team: { ls: string; lead: string; members: string[] };
  switchPlans: { name: string; steps: string[] }[];
  evidence: { photos: string[]; ts?: string };
  submittedAt: string;
};

type HistoryItem = { at: string; actor: string; action: string; note?: string };

// Dummy store
const MOCK: Record<string, { snapshot: Snapshot; history: HistoryItem[] }> = {
  "PTW-1201": {
    snapshot: {
      id: "PTW-1201",
      title: "Feeder F-101 Maintenance",
      category: "Maintenance",
      org: { region: "North Region", division: "Gulberg Division", feeder: "F-101", assetType: "Feeder", assetId: "F-101" },
      risk: { score: 15, band: "High", likelihood: 3, severity: 5 },
      team: { ls: "Ali Khan", lead: "Ali Khan", members: ["Sara Ahmed", "Bilal Hussain"] },
      switchPlans: [{ name: "Plan A", steps: ["Isolate feeder", "Prove dead", "Apply earths"] }],
      evidence: { photos: ["https://picsum.photos/seed/x1/600/320"], ts: "2025-09-22T10:25" },
      submittedAt: "2025-09-22 10:30",
    },
    history: [
      { at: "2025-09-22 10:30", actor: "LS Ali Khan", action: "Submitted" },
      { at: "2025-09-23 08:40", actor: "SDO Office", action: "Forwarded to XEN" },
    ],
  },
  "PTW-1202": {
    snapshot: {
      id: "PTW-1202",
      title: "Transformer T-55 Inspection",
      category: "Inspection",
      org: { region: "South Region", division: "DHA Division", feeder: "F-201", assetType: "Transformer", assetId: "T-55" },
      risk: { score: 6, band: "Low", likelihood: 2, severity: 3 },
      team: { ls: "Junaid I.", lead: "Junaid I.", members: ["Hina R."] },
      switchPlans: [{ name: "Basic Check", steps: ["Visual inspection", "IR Scan", "Oil test"] }],
      evidence: { photos: ["https://picsum.photos/seed/x2/600/320"], ts: "2025-09-23T07:00" },
      submittedAt: "2025-09-23 07:15",
    },
    history: [
      { at: "2025-09-23 07:15", actor: "LS Junaid I.", action: "Submitted" },
      { at: "2025-09-23 09:20", actor: "SDO Office", action: "Forwarded to XEN" },
    ],
  },
};

const riskPill = (band: RiskBand) =>
  band === "High"
    ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800"
    : band === "Medium"
    ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800";

const XenPtwApprove = () => {
  const { id } = useParams<{ id: string }>();
  const { snapshot: ptw, history } = useMemo(() => (id && MOCK[id]) || Object.values(MOCK)[0], [id]);
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");

  // Actions (dummy)
  const requireNotes = (msg: string) => {
    if (!notes.trim()) {
      alert(`${msg} — Decision Notes are required.`);
      return true;
    }
    return false;
  };

  const onApprove = () => {
    alert("✅ Approved → sent to PDC (dummy).");
    navigate("/xen/ptw");
  };
  const onReject = () => {
    if (requireNotes("Reject")) return;
    alert("❌ Rejected → sent back to SDO (dummy).");
    navigate("/xen/ptw");
  };
  const onRequestChanges = () => {
    if (requireNotes("Request Changes")) return;
    alert("📝 Changes requested → sent to LS (dummy).");
    navigate("/xen/ptw");
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">XEN – Approve PTW</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs bg-slate-100 text-slate-700">PTW: {ptw.id}</span>
          <span className={`px-3 py-1 rounded text-xs ring-1 ring-inset ${riskPill(ptw.risk.band)}`}>
            Risk: {ptw.risk.band} ({ptw.risk.score})
          </span>
        </div>
      </div>

      {/* Snapshot */}
      <div className="col-span-12 xl:col-span-8">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xl font-semibold">{ptw.title}</div>
              <div className="text-slate-500 text-sm">
                {ptw.category} • Submitted {ptw.submittedAt}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-500">LS</div>
              <div className="font-medium">{ptw.team.ls}</div>
            </div>
          </div>

          {/* Org */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Organization</div>
            <div className="grid grid-cols-12 gap-3 text-sm">
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Region</div>
                <div className="font-medium">{ptw.org.region}</div>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Division</div>
                <div className="font-medium">{ptw.org.division}</div>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <div className="text-slate-500">Asset</div>
                <div className="font-medium">
                  {ptw.org.assetType || "-"} {ptw.org.assetId ? `• ${ptw.org.assetId}` : ""}
                </div>
              </div>
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

        {/* History */}
        <div className="box p-6 mt-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">History</div>
          <ol className="relative border-s border-slate-300 dark:border-darkmode-400 pl-5 space-y-3">
            {history.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary/80" />
                <div className="text-sm">
                  <span className="font-medium">{h.action}</span> • {h.actor}
                </div>
                <div className="text-xs text-slate-500">{h.at}</div>
                {h.note && <div className="text-xs mt-1">{h.note}</div>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Decision Pane */}
      <div className="col-span-12 xl:col-span-4">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="font-semibold mb-3">Decision</div>

          <label className="block">
            <span className="text-xs text-slate-500">Decision Notes</span>
            <textarea
              rows={6}
              className="w-full !box rounded-md p-3 text-sm"
              placeholder="Reason / instructions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <Button variant="primary" onClick={onApprove}>
              <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Approve (→ PDC)
            </Button>
            <Button variant="outline-danger" onClick={onReject}>
              <Lucide icon="XOctagon" className="w-4 h-4 mr-2" /> Reject (→ SDO)
            </Button>
            <Button variant="outline-primary" onClick={onRequestChanges}>
              <Lucide icon="NotebookPen" className="w-4 h-4 mr-2" /> Request Changes
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/xen/ptw")}>
              <Lucide icon="ArrowLeftRight" className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            <div className="font-medium mb-1">Rules</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Notes required for Reject and Request Changes.</li>
              <li>Approve forwards to PDC; Reject returns to SDO; Request Changes goes to LS.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XenPtwApprove;
