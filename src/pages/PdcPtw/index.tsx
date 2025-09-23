import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";

// -------- Types --------
type Status = "Pending" | "Returned" | "Issued";
type Row = {
  id: string;           // PTW No
  title: string;
  division: string;
  dispatcher?: string;
  validityFrom?: string;
  validityTo?: string;
  status: Status;
};

// -------- Dummy data --------
const ROWS: Row[] = [
  {
    id: "PTW-1201",
    title: "Feeder F-101 Maintenance",
    division: "Gulberg Division",
    dispatcher: "Hassan R.",
    validityFrom: "2025-09-23 09:00",
    validityTo: "2025-09-23 17:00",
    status: "Pending",
  },
  {
    id: "PTW-1202",
    title: "Transformer T-55 Inspection",
    division: "DHA Division",
    dispatcher: "Fatima S.",
    validityFrom: "2025-09-24 08:30",
    validityTo: "2025-09-24 14:00",
    status: "Issued",
  },
  {
    id: "PTW-1203",
    title: "Line L-22 Hotspot Repair",
    division: "Satellite Town",
    dispatcher: "—",
    validityFrom: "2025-09-22 10:00",
    validityTo: "2025-09-22 16:00",
    status: "Returned",
  },
];

const ALL_DIVISIONS = Array.from(new Set(ROWS.map((r) => r.division))).sort();
const ALL_STATUS: Status[] = ["Pending", "Issued", "Returned"];

// -------- Component --------
const PdcPtwList = () => {
  const navigate = useNavigate();

  // filters
  const [q, setQ] = useState("");
  const [division, setDivision] = useState("all");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState(""); // filter by validityFrom date only (demo)

  // table state
  const [page, setPage] = useState(1);
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
  const pageSize = 10;

  const filtered = useMemo(() => {
    let rows = [...ROWS];
    if (q.trim()) {
      const k = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(k) ||
          r.title.toLowerCase().includes(k) ||
          r.division.toLowerCase().includes(k) ||
          (r.dispatcher || "").toLowerCase().includes(k)
      );
    }
    if (division !== "all") rows = rows.filter((r) => r.division === division);
    if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (date) {
      // very loose contains check on validityFrom
      rows = rows.filter((r) => (r.validityFrom || "").slice(0, 10) === date);
    }
    return rows;
  }, [q, division, status, date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const cellY = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">PDC – PTW Issuance</h2>
        <div className="ml-auto flex items-center gap-2">
          <FormSelect className="!w-36" value={density} onChange={(e) => setDensity(e.target.value as any)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </FormSelect>
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>
            <Lucide icon="RefreshCw" className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-3">
              <div className="relative text-slate-500">
                <Lucide icon="Search" className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4" />
                <FormInput
                  className="pl-9"
                  placeholder="Search PTW, Division, Dispatcher"
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect
                value={division}
                onChange={(e) => {
                  setPage(1);
                  setDivision(e.target.value);
                }}
              >
                <option value="all">All Divisions</option>
                {ALL_DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2">
              <FormInput
                type="date"
                value={date}
                onChange={(e) => {
                  setPage(1);
                  setDate(e.target.value);
                }}
              />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2">
              <FormSelect
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="all">All Status</option>
                {ALL_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2 flex items-center">
              <Button
                variant="outline-secondary"
                className="w-full"
                onClick={() => {
                  setQ("");
                  setDivision("all");
                  setStatus("all");
                  setDate("");
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
                  {["PTW No", "Title", "Division", "Validity", "Dispatcher", "Status", "Actions"].map((h) => (
                    <Table.Th
                      key={h}
                      className={
                        "sticky top-0 z-10 bg-white/80 dark:bg-darkmode-700/80 backdrop-blur supports-backdrop-blur:backdrop-blur text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide px-5 py-3 border-b border-slate-200/70 dark:border-darkmode-400" +
                        (h === "Actions" ? " text-center" : "")
                      }
                    >
                      {h}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {paged.map((r) => (
                  <Table.Tr key={r.id} className={clsx("group transition-all duration-200", density === "compact" ? "text-[13px]" : "text-sm")}>
                    <Table.Td className={clsx("px-5", cellY, "font-medium text-slate-800 dark:text-slate-100")}>{r.id}</Table.Td>
                    <Table.Td className={clsx("px-5", cellY)}>
                      <div className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[360px]">{r.title}</div>
                    </Table.Td>
                    <Table.Td className={clsx("px-5", cellY)}>{r.division}</Table.Td>
                    <Table.Td className={clsx("px-5", cellY)}>
                      {r.validityFrom || "-"} {r.validityFrom && r.validityTo ? "→" : ""} {r.validityTo || ""}
                    </Table.Td>
                    <Table.Td className={clsx("px-5", cellY)}>{r.dispatcher || "-"}</Table.Td>
                    <Table.Td className={clsx("px-5", cellY)}>
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
                          r.status === "Issued"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                            : r.status === "Returned"
                            ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800"
                            : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
                        )}
                      >
                        {r.status}
                      </span>
                    </Table.Td>
                    <Table.Td className={clsx("px-5", cellY, "text-center")}>
                      <Button
                        variant="outline-primary"
                        className="!px-3 !py-1.5 rounded-xl"
                        onClick={() => navigate(`/pdc-ptw/${r.id}`)}
                      >
                        <Lucide icon="FileCheck2" className="w-4 h-4 mr-1" /> Review / Issue
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}

                {paged.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="text-center py-10 text-slate-500">
                      No PTWs found for selected filters.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

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
            <FormSelect className="w-28 !box" value={density} onChange={(e) => setDensity(e.target.value as any)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdcPtwList;
