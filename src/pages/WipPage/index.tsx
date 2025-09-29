import React, { useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu, Dialog } from "@/components/Base/Headless";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type WipStatus = "Active" | "Paused" | "Suspended" | "Completed";

type WipRow = {
  id: number;
  ptwNo: string;
  jobTitle: string;
  status: WipStatus;
  lastUpdate: string;
  notesCount: number;
  photosCount: number;
};

/* -------------------------------------------------------------------------- */
/* Mock data (replace with API)                                                */
/* -------------------------------------------------------------------------- */
const MOCK_WIP: WipRow[] = [
  {
    id: 201,
    ptwNo: "PTW-25-0107",
    jobTitle: "Feeder-7 Conductor Jumper Replacement",
    status: "Active",
    lastUpdate: "2025-09-18 15:10",
    notesCount: 2,
    photosCount: 3,
  },
  {
    id: 202,
    ptwNo: "PTW-25-0108",
    jobTitle: "Substation Earthing Verification",
    status: "Paused",
    lastUpdate: "2025-09-18 10:22",
    notesCount: 1,
    photosCount: 0,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
const fmtNow = () =>
  new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
const WorkInProgressPage = () => {
  const navigate = useNavigate();

  // data
  const [rows, setRows] = useState<WipRow[]>(MOCK_WIP);

  // filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | WipStatus>("all");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // editor modal
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<WipRow | null>(null);

  // action dialog (pause/resume/suspend/extension)
  const [actOpen, setActOpen] = useState(false);
  const [actMode, setActMode] = useState<"pause" | "resume" | "suspend" | "extension">("pause");
  const [actRow, setActRow] = useState<WipRow | null>(null);
  const [actReason, setActReason] = useState("");
  const [actUntil, setActUntil] = useState(""); // yyyy-mm-dd

  // form state for add/edit update
  const [form, setForm] = useState({
    ptwNo: "",
    jobTitle: "",
    progressNotes: "",
    photos: null as FileList | null,
    pauseResumeReason: "",
    reqType: "" as "" | "suspend" | "extension",
    reqReason: "",
    reqUntil: "",
  });

  // computed
  const filtered = useMemo(() => {
    let r = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (x) =>
          x.ptwNo.toLowerCase().includes(q) ||
          x.jobTitle.toLowerCase().includes(q)
      );
    }
    if (status !== "all") r = r.filter((x) => x.status === status);
    return r;
  }, [rows, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const cellY = density === "compact" ? "py-2" : "py-3";

  /* ------------------------------ Handlers --------------------------------- */

  const resetForm = (row?: WipRow | null) => {
    setForm({
      ptwNo: row?.ptwNo ?? "",
      jobTitle: row?.jobTitle ?? "",
      progressNotes: "",
      photos: null,
      pauseResumeReason: "",
      reqType: "",
      reqReason: "",
      reqUntil: "",
    });
  };

  const onAdd = () => {
    setEditing(null);
    resetForm(null);
    setShowEdit(true);
  };

  const onEdit = (row: WipRow) => {
    setEditing(row);
    resetForm(row);
    setShowEdit(true);
  };

  const onSaveUpdate = () => {
    if (!form.ptwNo.trim() || !form.jobTitle.trim() || !form.progressNotes.trim()) {
      alert("PTW No, Job Title and Progress Notes are required.");
      return;
    }

    const photoCount = form.photos?.length ?? 0;

    if (editing) {
      setRows((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
                ...x,
                lastUpdate: fmtNow(),
                notesCount: x.notesCount + 1,
                photosCount: x.photosCount + photoCount,
              }
            : x
        )
      );
    } else {
      const newId = Math.max(0, ...rows.map((x) => x.id)) + 1;
      setRows((prev) => [
        {
          id: newId,
          ptwNo: form.ptwNo,
          jobTitle: form.jobTitle,
          status: "Active",
          lastUpdate: fmtNow(),
          notesCount: 1,
          photosCount: photoCount,
        },
        ...prev,
      ]);
    }

    // TODO: POST/PUT to backend with multipart form-data (photos[])
    setShowEdit(false);
  };

  const openAction = (mode: typeof actMode, row: WipRow) => {
    setActMode(mode);
    setActRow(row);
    setActReason("");
    setActUntil("");
    setActOpen(true);
  };

  const confirmAction = () => {
    if (!actRow) return;

    if (actMode === "pause") {
      setRows((prev) =>
        prev.map((x) => (x.id === actRow.id ? { ...x, status: "Paused", lastUpdate: fmtNow() } : x))
      );
      // TODO: POST /api/wip/:id/pause { reason: actReason }
    } else if (actMode === "resume") {
      setRows((prev) =>
        prev.map((x) => (x.id === actRow.id ? { ...x, status: "Active", lastUpdate: fmtNow() } : x))
      );
      // TODO: POST /api/wip/:id/resume { reason: actReason }
    } else if (actMode === "suspend") {
      setRows((prev) =>
        prev.map((x) => (x.id === actRow.id ? { ...x, status: "Suspended", lastUpdate: fmtNow() } : x))
      );
      // TODO: POST /api/wip/:id/suspend { reason: actReason }
    } else if (actMode === "extension") {
      // keep status; just request extension
      alert(
        `Extension requested for ${actRow.ptwNo} until ${actUntil || "(no date)"}.\nReason: ${actReason || "-"}`
      );
      // TODO: POST /api/wip/:id/extension { until: actUntil, reason: actReason }
    }

    setActOpen(false);
  };

  const onReportIncident = (row: WipRow) => {
    navigate(`/incidents/new?ptw=${encodeURIComponent(row.ptwNo)}`);
  };

  /* --------------------------------- UI ------------------------------------ */
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">G2 – Work In Progress</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <FormSelect
              className="!w-36"
              value={density}
              onChange={(e) => setDensity(e.target.value as "comfortable" | "compact")}
              title="Row density"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
          <Button variant="primary" onClick={onAdd} className="shadow-sm">
            <Lucide icon="Plus" className="w-4 h-4 mr-2" /> Add Update
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4">
              <div className="relative text-slate-500">
                <Lucide icon="Search" className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4" />
                <FormInput
                  className="pl-9"
                  placeholder="Search PTW or Job Title"
                  value={query}
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as "all" | WipStatus);
                }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Suspended">Suspended</option>
                <option value="Completed">Completed</option>
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2 flex items-center">
              <Button
                variant="outline-secondary"
                className="w-full"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-span-12 intro-y">
        <div className="box p-0 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 overflow-hidden">
          <div className="overflow-auto">
            <Table className="table-auto w-full">
              <Table.Thead>
                <Table.Tr>
                  {["SR", "PTW No", "Job Title", "Status", "Last Update", "Notes", "Photos", "Actions"].map(
                    (h, idx) => (
                      <Table.Th
                        key={h}
                        className={
                          "sticky top-0 z-10 bg-white/80 dark:bg-darkmode-700/80 backdrop-blur supports-backdrop-blur:backdrop-blur text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide px-5 py-3 border-b border-slate-200/70 dark:border-darkmode-400" +
                          (idx === 0 ? " w-14 text-center" : "") +
                          (h === "Actions" ? " text-center" : "")
                        }
                      >
                        {h}
                      </Table.Th>
                    )
                  )}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {paged.map((r, i) => {
                  const sr = (pageSafe - 1) * pageSize + i + 1;
                  return (
                    <Table.Tr
                      key={r.id}
                      className={clsx("group transition-all duration-200", density === "compact" ? "text-[13px]" : "text-sm")}
                    >
                      {/* SR */}
                      <Table.Td className={clsx("px-5", cellY, "text-center text-slate-500")}>{sr}</Table.Td>

                      {/* PTW */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <button
                          className="font-medium text-primary hover:underline"
                          onClick={() => navigate(`/work-inprogress/view`)}
                          title="View details"
                        >
                          {r.ptwNo}
                        </button>
                      </Table.Td>

                      {/* Job */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <Tippy as="span" content={r.jobTitle}>
                          <span className="truncate block max-w-[320px]">{r.jobTitle}</span>
                        </Tippy>
                      </Table.Td>

                      {/* Status */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
                            r.status === "Active" &&
                              "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
                            r.status === "Paused" &&
                              "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
                            r.status === "Suspended" &&
                              "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800",
                            r.status === "Completed" &&
                              "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-darkmode-400 dark:text-slate-200 dark:ring-darkmode-300"
                          )}
                        >
                          <span
                            className={clsx(
                              "h-1.5 w-1.5 rounded-full",
                              r.status === "Active" && "bg-emerald-500",
                              r.status === "Paused" && "bg-amber-500",
                              r.status === "Suspended" && "bg-rose-500",
                              r.status === "Completed" && "bg-slate-400"
                            )}
                          />
                          {r.status}
                        </span>
                      </Table.Td>

                      {/* Last Update */}
                      <Table.Td className={clsx("px-5", cellY)}>{r.lastUpdate}</Table.Td>

                      {/* Notes */}
                      <Table.Td className={clsx("px-5", cellY)}>{r.notesCount}</Table.Td>

                      {/* Photos */}
                      <Table.Td className={clsx("px-5", cellY)}>{r.photosCount}</Table.Td>

                      {/* Actions */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>
                        <Menu>
                          <Menu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                            <Lucide icon="MoreVertical" className="w-4 h-4" />
                          </Menu.Button>
                          <Menu.Items className="w-48">
                            <Menu.Item onClick={() => onEdit(r)} className="text-[12px]">
                              <Lucide icon="PencilLine" className="w-3.5 h-3.5 mr-2" /> Add / Edit Update
                            </Menu.Item>
                            <div className="my-1 h-px bg-slate-200 dark:bg-darkmode-400" />
                            {(r.status === "Active" || r.status === "Completed") && (
                              <Menu.Item onClick={() => openAction("pause", r)} className="text-[12px]">
                                <Lucide icon="PauseCircle" className="w-3.5 h-3.5 mr-2" /> Pause
                              </Menu.Item>
                            )}
                            {r.status === "Paused" && (
                              <Menu.Item onClick={() => openAction("resume", r)} className="text-[12px]">
                                <Lucide icon="PlayCircle" className="w-3.5 h-3.5 mr-2" /> Resume
                              </Menu.Item>
                            )}
                            {r.status !== "Suspended" && (
                              <Menu.Item onClick={() => openAction("suspend", r)} className="text-[12px] text-danger">
                                <Lucide icon="Ban" className="w-3.5 h-3.5 mr-2" /> Suspend
                              </Menu.Item>
                            )}
                            <Menu.Item onClick={() => openAction("extension", r)} className="text-[12px]">
                              <Lucide icon="Timer" className="w-3.5 h-3.5 mr-2" /> Request Extension
                            </Menu.Item>
                            <div className="my-1 h-px bg-slate-200 dark:bg-darkmode-400" />
                            <Menu.Item onClick={() => onReportIncident(r)} className="text-[12px]">
                              <Lucide icon="AlertTriangle" className="w-3.5 h-3.5 mr-2" /> Report Incident
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}

                {paged.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8} className="text-center py-10 text-slate-500">
                      No records found for selected filters.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* Subtle row styles */}
          <style>{`
            tbody tr { border-bottom: 1px dashed rgba(148,163,184,0.25); }
            tbody tr:hover { background: rgba(241,245,249,0.6); }
            .dark tbody tr:hover { background: rgba(30,41,59,0.45); }
          `}</style>

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="text-slate-500 text-sm mr-auto">
              Showing <span className="font-medium">{paged.length}</span> of {filtered.length}
            </div>
            <Pagination className="w-full sm:w-auto">
              <Pagination.Link onClick={() => setPage(1)}>
                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link onClick={() => setPage(Math.max(1, pageSafe - 1))}>
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link active>{pageSafe}</Pagination.Link>
              <Pagination.Link onClick={() => setPage(Math.min(totalPages, pageSafe + 1))}>
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link onClick={() => setPage(totalPages)}>
                <Lucide icon="ChevronsRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>
            <FormSelect
              className="w-28 !box"
              value={density}
              onChange={(e) => setDensity(e.target.value as "comfortable" | "compact")}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium">
              {editing ? "Edit Work Progress" : "Add Work Progress"}
            </div>
            <div className="mt-4 grid gap-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-6">
                  <label className="form-label required">PTW No</label>
                  <FormInput
                    value={form.ptwNo}
                    onChange={(e) => setForm((f) => ({ ...f, ptwNo: e.target.value }))}
                    placeholder="PTW-25-0107"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="form-label required">Job Title</label>
                  <FormInput
                    value={form.jobTitle}
                    onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="Feeder-7 Conductor Jumper Replacement"
                  />
                </div>
              </div>

              <div>
                <label className="form-label required">Progress Notes</label>
                <FormTextarea
                  rows={5}
                  value={form.progressNotes}
                  onChange={(e) => setForm((f) => ({ ...f, progressNotes: e.target.value }))}
                  placeholder="What happened since last update?"
                />
              </div>

              <div>
                <label className="form-label">Photos</label>
                <FormInput
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, photos: e.target.files || null }))
                  }
                />
                <div className="text-xs text-slate-500 mt-1">
                  You can attach multiple images.
                </div>
              </div>

              <div>
                <label className="form-label">Pause/Resume Reason</label>
                <FormInput
                  value={form.pauseResumeReason}
                  onChange={(e) => setForm((f) => ({ ...f, pauseResumeReason: e.target.value }))}
                  placeholder="If pausing or resuming, add reason"
                />
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-4">
                  <label className="form-label">Request Type</label>
                  <FormSelect
                    value={form.reqType}
                    onChange={(e) => setForm((f) => ({ ...f, reqType: e.target.value as "" | "suspend" | "extension" }))}
                  >
                    <option value="">None</option>
                    <option value="suspend">Suspend</option>
                    <option value="extension">Extension</option>
                  </FormSelect>
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <label className="form-label">Until (if Extension)</label>
                  <FormInput
                    type="date"
                    value={form.reqUntil}
                    onChange={(e) => setForm((f) => ({ ...f, reqUntil: e.target.value }))}
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <label className="form-label">Reason</label>
                  <FormInput
                    value={form.reqReason}
                    onChange={(e) => setForm((f) => ({ ...f, reqReason: e.target.value }))}
                    placeholder="Brief reason"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline-secondary" onClick={() => setShowEdit(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={onSaveUpdate}>
                  {editing ? "Save Changes" : "Create Update"}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Action Dialog (Pause/Resume/Suspend/Extension) */}
      <Dialog open={actOpen} onClose={() => setActOpen(false)}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium capitalize">
              {actMode === "extension" ? "Request Extension" : actMode}
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-sm">
                  PTW: <span className="font-medium">{actRow?.ptwNo}</span>
                </div>
                <div className="text-xs text-slate-500">{actRow?.jobTitle}</div>
              </div>

              {actMode === "extension" ? (
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-6">
                    <label className="form-label">Until Date</label>
                    <FormInput type="date" value={actUntil} onChange={(e) => setActUntil(e.target.value)} />
                  </div>
                  <div className="col-span-12">
                    <label className="form-label">Reason</label>
                    <FormInput
                      value={actReason}
                      onChange={(e) => setActReason(e.target.value)}
                      placeholder="Why is the extension required?"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label">Reason (optional)</label>
                  <FormInput
                    value={actReason}
                    onChange={(e) => setActReason(e.target.value)}
                    placeholder="Brief reason"
                  />
                </div>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline-secondary" onClick={() => setActOpen(false)}>
                  Cancel
                </Button>
                <Button variant={actMode === "suspend" ? "danger" : "primary"} onClick={confirmAction}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default WorkInProgressPage;
