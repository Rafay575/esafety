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
type CompletionStatus = "Pending" | "Submitted" | "Returned";

type CompletionRow = {
  id: number;
  ptwNo: string;
  jobTitle: string;
  status: CompletionStatus;
  lastUpdate: string;       // display string
  photosCount: number;      // Evidence L3 photos
  gps?: { lat: number; lng: number } | null;
  checklist: {
    toolsRemoved: boolean;
    earthingRemoved: boolean;
    dangerBoardsRemoved: boolean;
    siteCleared: boolean;
    controlRoomInformed: boolean;
  };
};

/* -------------------------------------------------------------------------- */
/* Mock data (replace with API later)                                          */
/* -------------------------------------------------------------------------- */
const MOCK_COMPLETION: CompletionRow[] = [
  {
    id: 501,
    ptwNo: "PTW-25-0129",
    jobTitle: "Pole-top Insulator Replacement – Feeder 11",
    status: "Pending",
    lastUpdate: "2025-09-19 11:02",
    photosCount: 0,
    gps: null,
    checklist: {
      toolsRemoved: false,
      earthingRemoved: false,
      dangerBoardsRemoved: false,
      siteCleared: false,
      controlRoomInformed: false,
    },
  },
  {
    id: 502,
    ptwNo: "PTW-25-0130",
    jobTitle: "LT Panel Tightening – Subdivision A",
    status: "Submitted",
    lastUpdate: "2025-09-18 17:25",
    photosCount: 4,
    gps: { lat: 31.5204, lng: 74.3587 },
    checklist: {
      toolsRemoved: true,
      earthingRemoved: true,
      dangerBoardsRemoved: true,
      siteCleared: true,
      controlRoomInformed: true,
    },
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
const CompletionListPage = () => {
  const navigate = useNavigate();

  // data
  const [rows, setRows] = useState<CompletionRow[]>(MOCK_COMPLETION);

  // filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CompletionStatus>("all");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // submit modal
  const [openSubmit, setOpenSubmit] = useState(false);
  const [activeRow, setActiveRow] = useState<CompletionRow | null>(null);

  // submit form state
  const [form, setForm] = useState({
    toolsRemoved: false,
    earthingRemoved: false,
    dangerBoardsRemoved: false,
    siteCleared: false,
    controlRoomInformed: false,
    notes: "",
    photos: null as FileList | null,
    lat: "",
    lng: "",
  });

  const resetFormFromRow = (row?: CompletionRow | null) => {
    setForm({
      toolsRemoved: !!row?.checklist.toolsRemoved,
      earthingRemoved: !!row?.checklist.earthingRemoved,
      dangerBoardsRemoved: !!row?.checklist.dangerBoardsRemoved,
      siteCleared: !!row?.checklist.siteCleared,
      controlRoomInformed: !!row?.checklist.controlRoomInformed,
      notes: "",
      photos: null,
      lat: row?.gps?.lat?.toString() ?? "",
      lng: row?.gps?.lng?.toString() ?? "",
    });
  };

  const openSubmitModal = (row: CompletionRow) => {
    setActiveRow(row);
    resetFormFromRow(row);
    setOpenSubmit(true);
  };

  const filtered = useMemo(() => {
    let r = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (x) => x.ptwNo.toLowerCase().includes(q) || x.jobTitle.toLowerCase().includes(q)
      );
    }
    if (status !== "all") r = r.filter((x) => x.status === status);
    return r;
  }, [rows, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const cellY = density === "compact" ? "py-2" : "py-3";

  const validateAndSubmit = () => {
    const allChecked =
      form.toolsRemoved &&
      form.earthingRemoved &&
      form.dangerBoardsRemoved &&
      form.siteCleared &&
      form.controlRoomInformed;

    const hasCoords =
      form.lat.trim() !== "" &&
      !Number.isNaN(Number(form.lat)) &&
      form.lng.trim() !== "" &&
      !Number.isNaN(Number(form.lng));

    const photosCount = form.photos?.length ?? 0;

    if (!allChecked) {
      alert("Please complete all checklist items before submitting.");
      return;
    }
    if (!hasCoords) {
      alert("Please provide GPS Latitude and Longitude.");
      return;
    }
    if (photosCount < 1) {
      alert("Please attach at least one photo as Evidence L3.");
      return;
    }

    if (!activeRow) return;
    setRows((prev) =>
      prev.map((x) =>
        x.id === activeRow.id
          ? {
              ...x,
              status: "Submitted",
              lastUpdate: fmtNow(),
              photosCount: x.photosCount + photosCount,
              gps: { lat: Number(form.lat), lng: Number(form.lng) },
              checklist: {
                toolsRemoved: form.toolsRemoved,
                earthingRemoved: form.earthingRemoved,
                dangerBoardsRemoved: form.dangerBoardsRemoved,
                siteCleared: form.siteCleared,
                controlRoomInformed: form.controlRoomInformed,
              },
            }
          : x
      )
    );

    // TODO: POST to backend (multipart/form-data)
    // /api/completion/{ptwId}/submit { checklist, notes, lat,lng, photos[] }
    setOpenSubmit(false);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">G3 – Completion (L3 Evidence)</h2>
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
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5">
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
                  setStatus(e.target.value as "all" | CompletionStatus);
                }}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Returned">Returned</option>
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
                  {["SR", "PTW No", "Job Title", "Status", "Checklist", "Photos", "GPS", "Last Update", "Actions"].map(
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
                  const ck = r.checklist;
                  const ckCount =
                    (ck.toolsRemoved ? 1 : 0) +
                    (ck.earthingRemoved ? 1 : 0) +
                    (ck.dangerBoardsRemoved ? 1 : 0) +
                    (ck.siteCleared ? 1 : 0) +
                    (ck.controlRoomInformed ? 1 : 0);

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
                          onClick={() => navigate(`/completion/${r.id}`)}
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
                            r.status === "Pending" &&
                              "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
                            r.status === "Submitted" &&
                              "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
                            r.status === "Returned" &&
                              "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800"
                          )}
                        >
                          <span
                            className={clsx(
                              "h-1.5 w-1.5 rounded-full",
                              r.status === "Pending" && "bg-amber-500",
                              r.status === "Submitted" && "bg-emerald-500",
                              r.status === "Returned" && "bg-rose-500"
                            )}
                          />
                          {r.status}
                        </span>
                      </Table.Td>

                      {/* Checklist */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <span className="text-slate-700">
                          {ckCount}/5 <span className="text-xs text-slate-500">done</span>
                        </span>
                      </Table.Td>

                      {/* Photos */}
                      <Table.Td className={clsx("px-5", cellY)}>{r.photosCount}</Table.Td>

                      {/* GPS */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        {r.gps ? (
                          <span className="text-xs text-slate-600">
                            {r.gps.lat.toFixed(5)}, {r.gps.lng.toFixed(5)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </Table.Td>

                      {/* Last Update */}
                      <Table.Td className={clsx("px-5", cellY)}>{r.lastUpdate}</Table.Td>

                      {/* Actions */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>
                        <Menu>
                          <Menu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                            <Lucide icon="MoreVertical" className="w-4 h-4" />
                          </Menu.Button>
                          <Menu.Items className="w-52">
                            <Menu.Item onClick={() => navigate(`/completion/${r.id}`)} className="text-[12px]">
                              <Lucide icon="Eye" className="w-3.5 h-3.5 mr-2" /> View
                            </Menu.Item>
                            {r.status !== "Submitted" && (
                              <Menu.Item onClick={() => openSubmitModal(r)} className="text-[12px]">
                                <Lucide icon="CheckCircle2" className="w-3.5 h-3.5 mr-2" /> Submit Completion
                              </Menu.Item>
                            )}
                            {r.status === "Returned" && (
                              <Menu.Item onClick={() => openSubmitModal(r)} className="text-[12px]">
                                <Lucide icon="RotateCcw" className="w-3.5 h-3.5 mr-2" /> Re-Submit
                              </Menu.Item>
                            )}
                          </Menu.Items>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}

                {paged.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={9} className="text-center py-10 text-slate-500">
                      No records found for selected filters.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* Row styles */}
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

      {/* Submit Completion Modal */}
      <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium">Submit Completion</div>

            <div className="mt-2 text-xs text-slate-500">
              PTW: <span className="font-medium">{activeRow?.ptwNo}</span> — {activeRow?.jobTitle}
            </div>

            <div className="mt-4 grid gap-4">
              {/* Checklist */}
              <div className="grid grid-cols-12 gap-3">
                {[
                  { key: "toolsRemoved", label: "Tools removed" },
                  { key: "earthingRemoved", label: "Earthing removed" },
                  { key: "dangerBoardsRemoved", label: "Danger boards removed" },
                  { key: "siteCleared", label: "Site cleared" },
                  { key: "controlRoomInformed", label: "Control room informed" },
                ].map(({ key, label }) => (
                  <label key={key} className="col-span-12 sm:col-span-6 lg:col-span-4 inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="form-label">Notes (optional)</label>
                <FormTextarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any remarks before final submission"
                />
              </div>

              {/* Evidence photos */}
              <div>
                <label className="form-label required">Evidence L3 Photos</label>
                <FormInput
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, photos: e.target.files || null }))
                  }
                />
                <div className="text-xs text-slate-500 mt-1">Attach at least one clear photo.</div>
              </div>

              {/* GPS */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-6">
                  <label className="form-label required">Latitude</label>
                  <FormInput
                    placeholder="e.g. 31.5204"
                    value={form.lat}
                    onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="form-label required">Longitude</label>
                  <FormInput
                    placeholder="e.g. 74.3587"
                    value={form.lng}
                    onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline-secondary" onClick={() => setOpenSubmit(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={validateAndSubmit}>
                  Submit Completion
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default CompletionListPage;
