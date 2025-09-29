import { useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu } from "@/components/Base/Headless";
import { useNavigate, useParams } from "react-router-dom";

/* ============================= Types ============================= */
type WipStatus = "In Progress" | "Paused" | "Suspended" | "Extension Pending";

type Photo = {
  url: string;
  name: string;
  sizeKb?: number;
};

type WipUpdate = {
  id: string;
  at: string;        // ISO or friendly timestamp
  by: string;        // user display name
  note: string;      // progress notes
  photos?: Photo[];  // optional photos
};

type WipRequest =
  | { kind: "none" }
  | { kind: "suspend"; reason: string }
  | { kind: "extension"; reason: string; until: string }; // YYYY-MM-DD

type WorkInProgress = {
  id: string;          // WIP id
  ptwNo: string;       // PTW number
  title: string;
  orgUnit: { division: string; subdivision?: string };
  status: WipStatus;
  startedAt: string;
  lastUpdateAt: string;

  // Current fields (7.2)
  latestProgressNote: string;
  latestPhotos: Photo[];
  pauseResumeReason?: string;
  currentRequest: WipRequest;

  // History
  updates: WipUpdate[];

  // Optional quick meta
  crewLead?: string;
  crewCount?: number;
};

/* ========================= Mock single WIP ======================== */
const MOCK_WIP: WorkInProgress = {
  id: "WIP-0001",
  ptwNo: "PTW-24-0091",
  title: "Feeder-12 Isolator Replacement",
  orgUnit: { division: "Gulberg Division", subdivision: "Block A" },
  status: "In Progress",
  startedAt: "2025-09-18 09:10",
  lastUpdateAt: "2025-09-18 14:22",

  latestProgressNote:
    "Isolator cover removed, bolts rust-treated. Awaiting additional clamps. Area barricading verified.",
  latestPhotos: [
    { url: "https://picsum.photos/seed/203/400/260", name: "worksite_1.jpg", sizeKb: 220 },
    { url: "https://picsum.photos/seed/204/400/260", name: "worksite_2.jpg", sizeKb: 180 },
  ],
  pauseResumeReason: "Short pause for tool calibration.",
  currentRequest: { kind: "none" },

  updates: [
    {
      id: "U-0003",
      at: "2025-09-18 14:22",
      by: "Ayesha Khan (LS)",
      note: "Clamp fit confirmed on side A, preparing side B.",
      photos: [{ url: "https://picsum.photos/seed/207/400/260", name: "sideA.jpg", sizeKb: 190 }],
    },
    {
      id: "U-0002",
      at: "2025-09-18 12:05",
      by: "Ayesha Khan (LS)",
      note: "Barricading completed, PPE verified, toolbox talk completed.",
      photos: [{ url: "https://picsum.photos/seed/205/400/260", name: "ppe.jpg", sizeKb: 140 }],
    },
    {
      id: "U-0001",
      at: "2025-09-18 09:18",
      by: "Ayesha Khan (LS)",
      note: "Arrived on site, isolations verified, danger boards placed.",
      photos: [{ url: "https://picsum.photos/seed/206/400/260", name: "dangerboard.jpg", sizeKb: 160 }],
    },
  ],

  crewLead: "Ayesha Khan",
  crewCount: 4,
};

/* =========================== View Page =========================== */
const WorkInProgressViewPage = () => {
  const { id } = useParams(); // e.g. /wip/:id
  const navigate = useNavigate();

  // In real life, fetch by id. For now, mock:
  const wip = useMemo(() => MOCK_WIP, [id]);

  // Action panels
  type Panel = "pause" | "resume" | "suspend" | "extension" | "incident" | null;
  const [panel, setPanel] = useState<Panel>(null);

  // Common small form states
  const [pauseReason, setPauseReason] = useState("");
  const [resumeReason, setResumeReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [extReason, setExtReason] = useState("");
  const [extUntil, setExtUntil] = useState("");

  // Mock submit handlers (wire to API)
  const submitPause = async () => {
    if (!pauseReason.trim()) return alert("Please provide a pause reason.");
    // TODO: POST /api/wip/:id/pause { reason }
    alert("Paused (mock).");
    setPanel(null);
  };
  const submitResume = async () => {
    if (!resumeReason.trim()) return alert("Please provide a resume reason.");
    // TODO: POST /api/wip/:id/resume { reason }
    alert("Resumed (mock).");
    setPanel(null);
  };
  const submitSuspend = async () => {
    if (!suspendReason.trim()) return alert("Please provide a suspension reason.");
    // TODO: POST /api/wip/:id/suspend { reason }
    alert("Suspension requested (mock).");
    setPanel(null);
  };
  const submitExtension = async () => {
    if (!extUntil) return alert("Please select the extension 'Until' date.");
    if (!extReason.trim()) return alert("Please provide a reason for extension.");
    // TODO: POST /api/wip/:id/extension { until, reason }
    alert("Extension requested (mock).");
    setPanel(null);
  };
  const submitIncident = async () => {
    // up to you what minimal fields you want here; for now just a stub
    alert("Incident flow stub (hook to /incidents/new with PTW link).");
    setPanel(null);
  };

  // Badge styling
  const statusBadge = (s: WipStatus) => {
    const map: Record<WipStatus, string> = {
      "In Progress":
        "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
      Paused:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
      Suspended:
        "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800",
      "Extension Pending":
        "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800",
    };
    return (
      <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset", map[s])}>
        <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
        {s}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <Button variant="outline-secondary" className="mr-3" onClick={() => navigate(-1)}>
          <Lucide icon="ArrowLeft" className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-medium">
          Work In Progress – <span className="font-semibold">{wip.ptwNo}</span>
        </h2>
        <div className="ml-3">{statusBadge(wip.status)}</div>
        <div className="ml-auto flex items-center gap-2">
          <Menu>
            <Menu.Button as={Button} variant="primary" className="shadow-sm">
              <Lucide icon="PlayCircle" className="w-4 h-4 mr-2" />
              Quick Actions
              <Lucide icon="ChevronDown" className="w-4 h-4 ml-2" />
            </Menu.Button>
            <Menu.Items className="w-52">
              <Menu.Item onClick={() => setPanel("pause")} className="text-[12px]">
                <Lucide icon="PauseCircle" className="w-3.5 h-3.5 mr-2" /> Pause
              </Menu.Item>
              <Menu.Item onClick={() => setPanel("resume")} className="text-[12px]">
                <Lucide icon="Play" className="w-3.5 h-3.5 mr-2" /> Resume
              </Menu.Item>
              <Menu.Item onClick={() => setPanel("suspend")} className="text-[12px]">
                <Lucide icon="PauseOctagon" className="w-3.5 h-3.5 mr-2" /> Suspend
              </Menu.Item>
              <Menu.Item onClick={() => setPanel("extension")} className="text-[12px]">
                <Lucide icon="Clock" className="w-3.5 h-3.5 mr-2" /> Request Extension
              </Menu.Item>
              <Menu.Item onClick={() => setPanel("incident")} className="text-[12px] text-danger">
                <Lucide icon="AlertTriangle" className="w-3.5 h-3.5 mr-2" /> Report Incident
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Summary */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="text-xs text-slate-500">PTW No</div>
              <div className="font-medium">{wip.ptwNo}</div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="text-xs text-slate-500">Title</div>
              <div className="font-medium">{wip.title}</div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="text-xs text-slate-500">Division</div>
              <div className="font-medium">
                {wip.orgUnit.division}
                {wip.orgUnit.subdivision ? ` / ${wip.orgUnit.subdivision}` : ""}
              </div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="text-xs text-slate-500">Started</div>
              <div className="font-medium">{wip.startedAt}</div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="text-xs text-slate-500">Last Update</div>
              <div className="font-medium">{wip.lastUpdateAt}</div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="text-xs text-slate-500">Crew</div>
              <div className="font-medium">
                {wip.crewLead} {wip.crewCount ? `(+${wip.crewCount - 1})` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left: Current WIP Fields | Right: Action panel */}
      <div className="col-span-12 grid grid-cols-12 gap-6">
        {/* Left */}
        <div className="col-span-12 lg:col-span-8">
          {/* Latest Progress Note */}
          <div className="box p-5 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Latest Progress</h3>
            </div>
            <div className="text-slate-800 dark:text-slate-100">{wip.latestProgressNote}</div>

            {/* Photos */}
            {wip.latestPhotos?.length ? (
              <>
                <div className="text-xs text-slate-500 mt-4">Photos</div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {wip.latestPhotos.map((p, i) => (
                    <div key={i} className="rounded-md overflow-hidden border">
                      <Tippy as="div" content={p.name}>
                        <img src={p.url} alt={p.name} className="w-full h-28 object-cover" />
                      </Tippy>
                      <div className="px-2 py-1 text-[11px] flex items-center justify-between">
                        <span className="truncate max-w-[70%]">{p.name}</span>
                        {typeof p.sizeKb === "number" && <span className="text-slate-500">{p.sizeKb} KB</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Pause/Resume Reason */}
          {wip.pauseResumeReason ? (
            <div className="box p-5 rounded-2xl mb-6">
              <div className="text-xs text-slate-500 mb-1">Pause/Resume Reason</div>
              <div className="font-medium">{wip.pauseResumeReason}</div>
            </div>
          ) : null}

          {/* Current Request */}
          {wip.currentRequest.kind !== "none" && (
            <div className="box p-5 rounded-2xl mb-6">
              <div className="text-xs text-slate-500 mb-2">Current Request</div>
              {wip.currentRequest.kind === "suspend" ? (
                <div className="space-y-1">
                  <div className="font-medium">Suspend</div>
                  <div className="text-slate-700">Reason: {wip.currentRequest.reason}</div>
                </div>
              ) : wip.currentRequest.kind === "extension" ? (
                <div className="space-y-1">
                  <div className="font-medium">Extension</div>
                  <div className="text-slate-700">Until: {wip.currentRequest.until}</div>
                  <div className="text-slate-700">Reason: {wip.currentRequest.reason}</div>
                </div>
              ) : null}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="box p-5 rounded-2xl">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <div className="relative pl-6">
              <div className="absolute left-[10px] top-0 bottom-0 w-px bg-slate-200 dark:bg-darkmode-400" />
              <div className="space-y-4">
                {wip.updates.map((u) => (
                  <div key={u.id} className="relative">
                    <span className="absolute -left-[2px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-200/50 dark:ring-emerald-900/40" />
                    <div className="text-[12px] text-slate-500">{u.at} • {u.by}</div>
                    <div className="mt-1 text-slate-800 dark:text-slate-100">{u.note}</div>
                    {u.photos?.length ? (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {u.photos.map((p, i) => (
                          <img key={i} src={p.url} alt={p.name} className="w-full h-24 object-cover rounded-md border" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Inline Action Panels */}
        <div className="col-span-12 lg:col-span-4">
          <div className="box p-5 rounded-2xl sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Quick Actions</h3>
              <Button variant="outline-secondary" onClick={() => setPanel(null)} className="!py-1 !px-2">
                <Lucide icon="X" className="w-4 h-4" />
              </Button>
            </div>

            {!panel && (
              <div className="grid gap-2">
                <Button variant="outline-primary" onClick={() => setPanel("pause")}>
                  <Lucide icon="PauseCircle" className="w-4 h-4 mr-2" /> Pause
                </Button>
                <Button variant="outline-primary" onClick={() => setPanel("resume")}>
                  <Lucide icon="Play" className="w-4 h-4 mr-2" /> Resume
                </Button>
                <Button variant="outline-primary" onClick={() => setPanel("suspend")}>
                  <Lucide icon="PauseOctagon" className="w-4 h-4 mr-2" /> Suspend
                </Button>
                <Button variant="outline-primary" onClick={() => setPanel("extension")}>
                  <Lucide icon="Clock" className="w-4 h-4 mr-2" /> Request Extension
                </Button>
                <Button variant="outline-danger" onClick={() => setPanel("incident")}>
                  <Lucide icon="AlertTriangle" className="w-4 h-4 mr-2" /> Report Incident
                </Button>
              </div>
            )}

            {panel === "pause" && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-2">Pause Work</div>
                <FormTextarea
                  rows={4}
                  placeholder="Reason for pause"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" onClick={submitPause}>
                    <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Confirm Pause
                  </Button>
                  <Button variant="outline-secondary" onClick={() => setPanel(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {panel === "resume" && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-2">Resume Work</div>
                <FormTextarea
                  rows={4}
                  placeholder="Reason for resuming"
                  value={resumeReason}
                  onChange={(e) => setResumeReason(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" onClick={submitResume}>
                    <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Confirm Resume
                  </Button>
                  <Button variant="outline-secondary" onClick={() => setPanel(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {panel === "suspend" && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-2">Suspend Request</div>
                <FormTextarea
                  rows={4}
                  placeholder="Reason for suspension"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" onClick={submitSuspend}>
                    <Lucide icon="Send" className="w-4 h-4 mr-2" /> Submit Request
                  </Button>
                  <Button variant="outline-secondary" onClick={() => setPanel(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {panel === "extension" && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-2">Extension Request</div>
                <div className="grid gap-2">
                  <FormInput type="date" value={extUntil} onChange={(e) => setExtUntil(e.target.value)} />
                  <FormTextarea
                    rows={4}
                    placeholder="Reason for extension"
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" onClick={submitExtension}>
                    <Lucide icon="Send" className="w-4 h-4 mr-2" /> Submit Request
                  </Button>
                  <Button variant="outline-secondary" onClick={() => setPanel(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {panel === "incident" && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-2">Report Incident</div>
                <div className="text-xs text-slate-500 mb-2">
                  This will redirect to the Incident module prefilled with PTW link.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => {
                      // navigate with state/query (example)
                      navigate(`/incidents/new?ptw=${encodeURIComponent(wip.ptwNo)}`);
                    }}
                  >
                    <Lucide icon="AlertTriangle" className="w-4 h-4 mr-2" />
                    Go to Incident Form
                  </Button>
                  <Button variant="outline-secondary" onClick={() => setPanel(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* small styles */}
      <style>{`
        .box { background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(248,250,252,0.9)); }
        .dark .box { background: linear-gradient(to bottom, rgba(30,41,59,0.6), rgba(30,41,59,0.4)); }
      `}</style>
    </div>
  );
};

export default WorkInProgressViewPage;
