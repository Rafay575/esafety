// src/pages/PtwList.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu } from "@/components/Base/Headless";

import { getPermits, ORGS, PermitRow } from "./data";

export default function PtwList() {
  // UI state
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");

  // Pagination (client-side demo)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Source (dummy store)
  const permits: PermitRow[] = getPermits();

  // Regions for filter
  const regions = useMemo(
    () => Array.from(new Set(ORGS.map((o) => o.name))).sort(),
    []
  );

  // Filtered rows
  const filtered = useMemo(() => {
    let rows = [...permits];

    // text search across a few columns
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          r.lead.toLowerCase().includes(q)
      );
    }

    if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (region !== "all") rows = rows.filter((r) => r.region === region);

    return rows;
  }, [query, status, region, permits]);

  // Paged view
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  // Density helper
  const cellY = density === "compact" ? "py-2" : "py-3";

  // Actions
  const onCreate = () => navigate("/pjra-ptw/add");
  const onView = (p: PermitRow) => console.log("View", p.id);
  const onWithdraw = (p: PermitRow) => console.log("Withdraw", p.id);
  const onAssignTeam = (p: PermitRow) => console.log("Assign team", p.id);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header / Actions */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">Permits To Work</h2>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <FormSelect
              className="!w-36"
              value={density}
              onChange={(e) => setDensity(e.target.value as any)}
              title="Row density"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>

          <Button variant="primary" onClick={onCreate} className="shadow-sm">
            <Lucide icon="PlusCircle" className="w-4 h-4 mr-2" /> Create PTW
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="grid grid-cols-12 gap-4">
            {/* Search */}
            <div className="col-span-12 lg:col-span-4">
              <div className="relative text-slate-500">
                <Lucide icon="Search" className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4" />
                <FormInput
                  className="pl-9"
                  placeholder="Search by PTW ID, Title, Region, or Lead"
                  value={query}
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Region */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect
                value={region}
                onChange={(e) => {
                  setPage(1);
                  setRegion(e.target.value);
                }}
              >
                <option value="all">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* Status */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </FormSelect>
            </div>

            {/* Reset */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-2 flex items-center">
              <Button
                variant="outline-secondary"
                className="w-full"
                onClick={() => {
                  setQuery("");
                  setRegion("all");
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
                  {[
                    "SR",
                    "PTW ID",
                    "Title",
                    "Region",
                    "Lead",
                    "Window",
                    "Status",
                    "Actions",
                  ].map((h, idx) => (
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
                  ))}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {paged.map((p, i) => {
                  const sr = (pageSafe - 1) * pageSize + i + 1;
                  return (
                    <Table.Tr
                      key={p.id}
                      className={clsx(
                        "group transition-all duration-200",
                        density === "compact" ? "text-[13px]" : "text-sm"
                      )}
                    >
                      {/* SR */}
                      <Table.Td className={clsx("px-5", cellY, "text-center text-slate-500")}>
                        {sr}
                      </Table.Td>

                      {/* PTW ID */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{p.id}</span>
                      </Table.Td>

                      {/* Title */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          <Tippy as="span" content={p.title}>
                            <span className="truncate block max-w-[280px]">{p.title}</span>
                          </Tippy>
                        </div>
                      </Table.Td>

                      {/* Region */}
                      <Table.Td className={clsx("px-5", cellY)}>{p.region}</Table.Td>

                      {/* Lead */}
                      <Table.Td className={clsx("px-5", cellY)}>{p.lead}</Table.Td>

                      {/* Window */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <div className="text-slate-700 dark:text-slate-300">
                          {p.windowStart} → {p.windowEnd}
                        </div>
                      </Table.Td>

                      {/* Status */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
                            p.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                              : p.status === "approved"
                              ? "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800"
                              : p.status === "submitted"
                              ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
                              : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-darkmode-500 dark:text-slate-200 dark:ring-slate-700"
                          )}
                        >
                          <span
                            className={clsx(
                              "h-1.5 w-1.5 rounded-full",
                              p.status === "active"
                                ? "bg-emerald-500"
                                : p.status === "approved"
                                ? "bg-sky-500"
                                : p.status === "submitted"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            )}
                          />
                          {p.status}
                        </span>
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>
                        <Menu>
                          <Menu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                            <Lucide icon="MoreVertical" className="w-4 h-4" />
                          </Menu.Button>
                          <Menu.Items className="w-44">
                            <Menu.Item onClick={() => onView(p)} className="text-[12px]">
                              <Lucide icon="Eye" className="w-3.5 h-3.5 mr-2" /> View
                            </Menu.Item>
                            <Menu.Item onClick={() => onAssignTeam(p)} className="text-[12px]">
                              <Lucide icon="Users" className="w-3.5 h-3.5 mr-2" /> Assign Team
                            </Menu.Item>
                            <Menu.Item onClick={() => onWithdraw(p)} className="text-[12px] text-danger">
                              <Lucide icon="XCircle" className="w-3.5 h-3.5 mr-2" /> Withdraw
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
                      No permits found for selected filters.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* Subtle row separators & hover effect */}
          <style>{`
            tbody tr { border-bottom: 1px dashed rgba(148,163,184,0.25); }
            tbody tr:hover { background: rgba(241,245,249,0.6); }
            .dark tbody tr:hover { background: rgba(30,41,59,0.45); }
          `}</style>

          {/* Footer: results & pagination */}
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
              onChange={(e) => setDensity(e.target.value as any)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
        </div>
      </div>
    </div>
  );
}
