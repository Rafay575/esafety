import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";

// ---------- Dummy store ----------
type Snapshot = {
  id: string;
  title: string;
  division: string;
  category: "Maintenance" | "Emergency" | "Inspection" | "Upgrade";
  riskScore: number;
  ls: string;
  submittedAt: string;
  precautions: string[];            // compiled precautions, read-only display
};

const MOCK: Record<string, Snapshot> = {
  "PTW-1201": {
    id: "PTW-1201",
    title: "Feeder F-101 Maintenance",
    division: "Gulberg Division",
    category: "Maintenance",
    riskScore: 15,
    ls: "Ali Khan",
    submittedAt: "2025-09-22 10:30",
    precautions: [
      "Verify isolation and prove dead",
      "Apply portable earths at designated points",
      "Barricade work area and display signage",
    ],
  },
  "PTW-1202": {
    id: "PTW-1202",
    title: "Transformer T-55 Inspection",
    division: "DHA Division",
    category: "Inspection",
    riskScore: 6,
    ls: "Junaid I.",
    submittedAt: "2025-09-23 07:15",
    precautions: ["Follow standard inspection SOP", "Use IR camera per checklist"],
  },
};

// ---------- Helpers ----------
const genPtwNumber = (base: string) => base; // keep the incoming PTW No as-is for PDC issuance (demo)
const fmtValidity = (from?: string, to?: string) => (from && to ? `${from} → ${to}` : "-");

// ---------- Component ----------
const PdcPtwIssue = () => {
  const { id } = useParams<{ id: string }>();
  const snapshot = useMemo(() => (id && MOCK[id]) || Object.values(MOCK)[0], [id]);
  const navigate = useNavigate();

  // Form data for issuance
  const [impactNotes, setImpactNotes] = useState("");
  const [backfeedRisk, setBackfeedRisk] = useState(false);
  const [plannedOutageId, setPlannedOutageId] = useState("");
  const [dispatcher, setDispatcher] = useState("");
  const [ptwNo] = useState(genPtwNumber(snapshot.id)); // auto / read-only

  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [isolationPoints, setIsolationPoints] = useState<string[]>([""]);
  const [earthingPoints, setEarthingPoints] = useState<string[]>([""]);

  const [qrGenerated, setQrGenerated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addIso = () => setIsolationPoints((a) => [...a, ""]);
  const addEarth = () => setEarthingPoints((a) => [...a, ""]);
  const delIso = (i: number) => setIsolationPoints((a) => a.filter((_, idx) => idx !== i));
  const delEarth = (i: number) => setEarthingPoints((a) => a.filter((_, idx) => idx !== i));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!dispatcher.trim()) e.dispatcher = "Dispatcher name is required";
    if (!validFrom) e.validFrom = "Validity From is required";
    if (!validTo) e.validTo = "Validity To is required";
    if (validFrom && validTo && new Date(validTo) < new Date(validFrom)) e.validTo = "End must be after Start";

    if (isolationPoints.filter((s) => s.trim()).length === 0) e.isolation = "At least one isolation point required";
    if (earthingPoints.filter((s) => s.trim()).length === 0) e.earthing = "At least one earthing point required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Actions (dummy)
  const onIssue = () => {
    if (!validate()) return;
    // pretend QR/PDF generation and mark status as Issued
    setQrGenerated(true);
    alert(`✅ PTW Issued\nNo: ${ptwNo}\nValidity: ${fmtValidity(validFrom, validTo)}\n(Generated QR/PDF - demo)`);
    navigate("/pdc/ptw");
  };
  const onReturn = () => {
    if (!impactNotes.trim()) {
      alert("Please provide System Impact Notes before returning.");
      return;
    }
    alert("↩️ Returned to XEN/SDO with notes (dummy).");
    navigate("/pdc/ptw");
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button as="a" onClick={() => navigate(-1)} variant="outline-secondary" className="!px-3">
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">PDC – Issue PTW</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs bg-slate-100 text-slate-700">PTW: {snapshot.id}</span>
          {qrGenerated ? (
            <span className="px-3 py-1 rounded text-xs bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">QR/PDF Generated</span>
          ) : (
            <span className="px-3 py-1 rounded text-xs bg-amber-50 text-amber-700 ring-1 ring-amber-200">Not Generated</span>
          )}
        </div>
      </div>

      {/* Left: Snapshot */}
      <div className="col-span-12 ">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xl font-semibold">{snapshot.title}</div>
              <div className="text-slate-500 text-sm">
                {snapshot.category} • Division: {snapshot.division} • Submitted {snapshot.submittedAt}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-500">LS</div>
              <div className="font-medium">{snapshot.ls}</div>
              <div className="text-slate-500 mt-2">Risk</div>
              <div className="font-medium">{snapshot.riskScore}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Compiled Precautions</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {snapshot.precautions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right: Issue Form */}
      <div className="col-span-12">
        <div className="box p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-white/80 dark:bg-darkmode-700">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Issuance Details</div>

          {/* System Impact / Backfeed */}
          <label className="block mb-4">
            <span className="text-xs text-slate-500">System Impact Notes</span>
            <textarea
              rows={4}
              className="w-full !box rounded-md p-3 text-sm"
              placeholder="Describe expected system impacts, contingencies, switching dependencies..."
              value={impactNotes}
              onChange={(e) => setImpactNotes(e.target.value)}
            />
          </label>

          <FormCheck className="mb-4">
            <FormCheck.Input
              id="pdc-backfeed"
              type="checkbox"
              checked={backfeedRisk}
              onChange={(e) => setBackfeedRisk(e.target.checked)}
            />
            <FormCheck.Label htmlFor="pdc-backfeed">Backfeed Risk</FormCheck.Label>
          </FormCheck>

          {/* Basic IDs */}
          <div className="grid grid-cols-12 gap-4">
            <label className="col-span-12 md:col-span-6">
              <span className="text-xs text-slate-500">Planned Outage ID</span>
              <FormInput
                value={plannedOutageId}
                onChange={(e) => setPlannedOutageId(e.target.value)}
                placeholder="e.g., PO-2025-0912-A"
              />
            </label>
            <label className="col-span-12 md:col-span-6">
              <span className="text-xs text-slate-500">Dispatcher Name *</span>
              <FormInput
                value={dispatcher}
                onChange={(e) => setDispatcher(e.target.value)}
                placeholder="e.g., Hassan R."
              />
              {errors.dispatcher && <p className="text-rose-500 text-xs mt-1">{errors.dispatcher}</p>}
            </label>

            <label className="col-span-12 md:col-span-6">
              <span className="text-xs text-slate-500">PTW No (auto)</span>
              <FormInput value={ptwNo} readOnly disabled />
            </label>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-12 gap-4 mt-2">
            <label className="col-span-12 md:col-span-6">
              <span className="text-xs text-slate-500">Validity From *</span>
              <FormInput type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              {errors.validFrom && <p className="text-rose-500 text-xs mt-1">{errors.validFrom}</p>}
            </label>
            <label className="col-span-12 md:col-span-6">
              <span className="text-xs text-slate-500">Validity To *</span>
              <FormInput type="datetime-local" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
              {errors.validTo && <p className="text-rose-500 text-xs mt-1">{errors.validTo}</p>}
            </label>
          </div>

          {/* Isolation Points */}
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Isolation Points *</div>
            {errors.isolation && <p className="text-rose-500 text-xs mb-2">{errors.isolation}</p>}
            <div className="space-y-2">
              {isolationPoints.map((val, i) => (
                <div key={`iso-${i}`} className="flex items-center gap-2">
                  <FormInput
                    value={val}
                    placeholder="e.g., Open AB Switch at Pole 23"
                    onChange={(e) =>
                      setIsolationPoints((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                  />
                  <Button variant="outline-secondary" className="!px-2" onClick={() => delIso(i)}>
                    <Lucide icon="X" className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline-primary" className="!mt-1" onClick={addIso}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Isolation Point
              </Button>
            </div>
          </div>

          {/* Earthing Points */}
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Earthing Points *</div>
            {errors.earthing && <p className="text-rose-500 text-xs mb-2">{errors.earthing}</p>}
            <div className="space-y-2">
              {earthingPoints.map((val, i) => (
                <div key={`earth-${i}`} className="flex items-center gap-2">
                  <FormInput
                    value={val}
                    placeholder="e.g., Apply earths at Bay 3, Bus A"
                    onChange={(e) =>
                      setEarthingPoints((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                  />
                  <Button variant="outline-secondary" className="!px-2" onClick={() => delEarth(i)}>
                    <Lucide icon="X" className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline-primary" className="!mt-1" onClick={addEarth}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Earthing Point
              </Button>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="primary" onClick={onIssue}>
              <Lucide icon="FileCheck2" className="w-4 h-4 mr-2" /> Issue PTW
            </Button>
            <Button variant="outline-danger" onClick={onReturn}>
              <Lucide icon="Undo2" className="w-4 h-4 mr-2" /> Return (→ XEN/SDO)
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/pdc/ptw")}>
              <Lucide icon="ArrowLeftRight" className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </div>

          {/* Quick Preview Card */}
          <div className="mt-6 rounded-xl border border-slate-200/70 dark:border-darkmode-400 p-4 text-sm">
            <div className="font-semibold mb-2">Preview</div>
            <div>PTW No: <span className="font-medium">{ptwNo}</span></div>
            <div>Validity: <span className="font-medium">{fmtValidity(validFrom, validTo)}</span></div>
            <div>Dispatcher: <span className="font-medium">{dispatcher || "-"}</span></div>
            <div>Backfeed Risk: <span className="font-medium">{backfeedRisk ? "Yes" : "No"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdcPtwIssue;
