import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu, Dialog } from "@/components/Base/Headless";
import { useNavigate } from "react-router-dom";
import { regionsApi } from "./api";
import type { Region, Status } from "../types";

type FilterStatus = "all" | Status;

export default function RegionsListPage() {
  const navigate = useNavigate();

  // filters & paging
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
  const [page, setPage] = useState(1);
  const [size] = useState(10);

  // data
  const [rows, setRows] = useState<Region[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // delete confirm
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await regionsApi.list({ q, status, page, size });
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      alert("Failed to load regions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page, size]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const pageSafe = Math.min(page, totalPages);
  const cellY = density === "compact" ? "py-2" : "py-3";

  const onAdd = () => navigate("/organization/regions/create");
  const onView = (id: string) => navigate(`/organization/regions/${id}/view`);
  const onEdit = (id: string) => navigate(`/organization/regions/${id}/edit`);

  const onDeleteAsk = (id: string) => {
    setDelId(id);
    setDelOpen(true);
  };
  const onDeleteConfirm = async () => {
    if (!delId) return;
    try {
      await regionsApi.remove(delId);
      setDelOpen(false);
      setDelId(null);
      // reload current page
      fetchList();
    } catch {
      alert("Delete failed.");
    }
  };

  const onToggleStatus = async (id: string) => {
    try {
      await regionsApi.toggleStatus(id);
      fetchList();
    } catch {
      alert("Failed to toggle status.");
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">Organization → Regions</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <FormSelect
              className="!w-36"
              value={density}
              onChange={(e) =>  setDensity(e.target.value as any)}
              title="Row density"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
          <Button variant="primary" onClick={onAdd} className="shadow-sm">
            <Lucide icon="Plus" className="w-4 h-4 mr-2" /> Create Region
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
                  placeholder="Search by name or code"
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
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as FilterStatus);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2 flex items-center">
              <Button
                variant="outline-secondary"
                className="w-full"
                onClick={() => {
                  setQ("");
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
                  {["SR", "Name", "Code", "Status", "Updated", "Actions"].map((h, idx) => (
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
                {loading && (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="py-10 text-center text-slate-500">
                      Loading…
                    </Table.Td>
                  </Table.Tr>
                )}

                {!loading &&
                  rows.map((r, i) => {
                    const sr = (pageSafe - 1) * size + i + 1;
                    return (
                      <Table.Tr key={r.id} className={clsx("group transition-all duration-200", density === "compact" ? "text-[13px]" : "text-sm")}>
                        {/* SR */}
                        <Table.Td className={clsx("px-5", cellY, "text-center text-slate-500")}>{sr}</Table.Td>

                        {/* Name */}
                        <Table.Td className={clsx("px-5", cellY)}>
                          <button className="font-medium text-slate-800 hover:underline" onClick={() => onView(r.id)}>
                            {r.name}
                          </button>
                        </Table.Td>

                        {/* Code */}
                        <Table.Td className={clsx("px-5", cellY)}>
                          <Tippy as="span" content={r.code || "-"}>
                            <span className="truncate block max-w-[180px]">{r.code || "-"}</span>
                          </Tippy>
                        </Table.Td>

                        {/* Status */}
                        <Table.Td className={clsx("px-5", cellY, "text-center")}>
                          <button
                            onClick={() => onToggleStatus(r.id)}
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
                              r.status === "active"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                                : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-darkmode-400 dark:text-slate-200 dark:ring-darkmode-300"
                            )}
                            title="Toggle status"
                          >
                            <span className={clsx("h-1.5 w-1.5 rounded-full", r.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                            {r.status}
                          </button>
                        </Table.Td>

                        {/* Updated */}
                        <Table.Td className={clsx("px-5", cellY, "whitespace-nowrap")}>
                          {new Date(r.updatedAt).toLocaleString()}
                        </Table.Td>

                        {/* Actions */}
                        <Table.Td className={clsx("px-5", cellY, "text-center")}>
                          <Menu>
                            <Menu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                              <Lucide icon="MoreVertical" className="w-4 h-4" />
                            </Menu.Button>
                            <Menu.Items className="w-44">
                              <Menu.Item onClick={() => onView(r.id)} className="text-[12px]">
                                <Lucide icon="Eye" className="w-3.5 h-3.5 mr-2" /> View
                              </Menu.Item>
                              <Menu.Item onClick={() => onEdit(r.id)} className="text-[12px]">
                                <Lucide icon="PencilLine" className="w-3.5 h-3.5 mr-2" /> Edit
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item onClick={() => onDeleteAsk(r.id)} className="text-[12px] text-danger">
                                <Lucide icon="Trash2" className="w-3.5 h-3.5 mr-2" /> Delete
                              </Menu.Item>
                            </Menu.Items>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}

                {!loading && rows.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="py-10 text-center text-slate-500">
                      No regions found.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="text-slate-500 text-sm mr-auto">
              Showing <span className="font-medium">{rows.length}</span> of {total}
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

      {/* Delete dialog */}
      <Dialog open={delOpen} onClose={setDelOpen}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium">Delete Region</div>
            <div className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Are you sure you want to delete this region?
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline-secondary" onClick={() => setDelOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={onDeleteConfirm}>
                <Lucide icon="Trash2" className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
