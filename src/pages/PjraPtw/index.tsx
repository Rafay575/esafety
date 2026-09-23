"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { GenericTable } from "@/components/Base/GenericTable";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
// ── Types ─────────────────────────────────────────────────────────────────────

type PTW = {
  id: number;
  ptw_code: string;
  work_order_no: string | null;
  type: string;
  misc_type: string | null;
  feeder_incharge_name: string;
  scope_of_work: string;
  place_of_work: string;
  scheduled_start_at: string | null;
  due_time: string | null;
  current_status: string;
  status_label_en: string;
  feeder?: { id: number; name: string; code: string };
  sub_division?: { id: number; name: string };
  ls?: { id: number; name: string };
  sdo?: { id: number; name: string };
  created_at: string;
  updated_at: string;
};

interface CanFilter {
  circle: boolean;
  division: boolean;
  sub_division: boolean;
}

interface FilterOptionItem {
  id: number;
  code?: string;
  name: string;
  circle_id?: number;
  division_id?: number;
  is_active?: boolean;
}

interface FilterOptions {
  role?: string;
  can_filter: CanFilter;
  circles: FilterOptionItem[];
  divisions: FilterOptionItem[];
  sub_divisions: FilterOptionItem[];
}

type PTWResponse = {
  message: string;
  filter_options?: FilterOptions;
  filters?: Record<string, unknown>;
  data: {
    data: PTW[];
    total: number;
    current_page: number;
    per_page: number;
  };
};

type PTWFilters = {
  status: string;
  from_date: string;
  to_date: string;
  sort_by: string;
  sort_dir: "asc" | "desc";
  // ── hierarchy (only sent when > 0) ──
  circle_id: number;
  division_id: number;
  sub_division_id: number;
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────

function buildQueryParams(filters: PTWFilters, overrides?: {
  page?: number;
  perPage?: number | "all";
  search?: string;
}) {
  const params: Record<string, string | number> = {};

  if (overrides?.page != null) params.page = overrides.page;
  if (overrides?.perPage != null) params.per_page = overrides.perPage;
  if (overrides?.search) params.search = overrides.search;

  if (filters.status) params.status = filters.status;
  if (filters.from_date) params.from_date = filters.from_date;
  if (filters.to_date) params.to_date = filters.to_date;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_dir) params.sort_dir = filters.sort_dir;

  if (filters.circle_id > 0) params.circle_id = filters.circle_id;
  if (filters.division_id > 0) params.division_id = filters.division_id;
  if (filters.sub_division_id > 0)
    params.sub_division_id = filters.sub_division_id;

  return params;
}

async function getPTWs(args: {
  page: number;
  perPage: number;
  search: string;
  filters: PTWFilters;
}) {
  const { page, perPage, search, filters } = args;

  try {
    const { data } = await api.get<PTWResponse>("/api/v1/ptw", {
      params: buildQueryParams(filters, { page, perPage, search }),
    });

    // Merge filter_options from the top level into the returned object so
    // existing consumers of `.data` / `.total` keep working unchanged.
    return {
      ...data.data,
      filter_options: data.filter_options,
      applied_filters: data.filters,
    };
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to load PTWs");
    throw err;
  }
}

async function fetchAllPTWs(args: {
  search: string;
  filters: PTWFilters;
}): Promise<PTW[]> {
  const { search, filters } = args;

  const BATCH = 500;
  const MAX_PAGES = 200;

  let page = 1;
  let all: PTW[] = [];
  let total = Infinity;

  while (page <= MAX_PAGES && all.length < total) {
    const { data } = await api.get<PTWResponse>("/api/v1/ptw", {
      params: buildQueryParams(filters, { page, perPage: BATCH, search }),
    });

    const block = data.data;
    const rows = block?.data ?? [];
    if (!rows.length) break;

    all = all.concat(rows);
    total = block?.total ?? all.length;
    page += 1;
  }

  return all;
}

// ── Status options ────────────────────────────────────────────────────────────

const PTW_STATUS_OPTIONS = [
  "DRAFT",
  "SUBMITTED",
  "SDO_RETURNED",
  "SDO_CANCELLED",
  "SDO_FORWARDED_TO_XEN",
  "LS_RESUBMIT_TO_XEN",
  "XEN_RETURNED_TO_LS",
  "XEN_REJECTED",
  "XEN_APPROVED_TO_PDC",
  "PDC_RETURNED_TO_LS",
  "LS_RESUBMIT_TO_PDC",
  "PDC_DELEGATED_TO_GRID",
  "PDC_REJECTED",
  "GRID_PRECHECKS_DONE",
  "PTW_ISSUED",
  "IN_EXECUTION",
  "COMPLETION_SUBMITTED",
  "GRID_RESTORED_AND_CLOSED",
  "CANCELLATION_REQUESTED_BY_LS",
  "CANCELLATION_APPROVED_BY_SDO",
  "GRID_CANCELLATION_CONFIRMED_AND_CLOSED",
  "PDC_CONFIRMED",
  "PENDING_PDC_CONFIRMATION",
  "GRID_RESOLVE_REQUIRED",
  "RE_SUBMITTED_TO_PDC",
  "NO_PTW_APPROVED_BY_SDO",
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PTWListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [filters, setFilters] = useState<PTWFilters>({
    status: "",
    from_date: "",
    to_date: "",
    sort_by: "updated_at",
    sort_dir: "desc",
    circle_id: 0,
    division_id: 0,
    sub_division_id: 0,
  });

  const authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const userRoles: string[] = authUser?.roles ?? [];

  const queryKey = useMemo(
    () => ["ptw", page, perPage, search, filters],
    [page, perPage, search, filters],
  );

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => getPTWs({ page, perPage, search, filters }),
  });

  const ptws = data?.data ?? [];
  const total = data?.total ?? 0;

  // ── Filter options (from the SAME response) ───────────────────────────────
  // Keep the last filter options so the dropdowns don't disappear while a new
  // request is loading (a new query key means `data` is empty until it arrives).
  const [retainedFilterOptions, setRetainedFilterOptions] =
    useState<FilterOptions | null>(null);

  useEffect(() => {
    if (data?.filter_options) setRetainedFilterOptions(data.filter_options);
  }, [data?.filter_options]);

  const filterOptions: FilterOptions | null =
    data?.filter_options ?? retainedFilterOptions;

  const canFilter: CanFilter = filterOptions?.can_filter ?? {
    circle: false,
    division: false,
    sub_division: false,
  };

  const activeOnly = (list?: FilterOptionItem[]) =>
    (list ?? []).filter((o) => o.is_active !== false);

  const circleOptions = activeOnly(filterOptions?.circles);
  const divisionOptions = activeOnly(filterOptions?.divisions);
  const subDivisionOptions = activeOnly(filterOptions?.sub_divisions);

  // Number of hierarchy filters that are shown
  const hierarchyCount =
    (canFilter.circle ? 1 : 0) +
    (canFilter.division ? 1 : 0) +
    (canFilter.sub_division ? 1 : 0);

  const totalCols = 5 + hierarchyCount;

  const gridColsClass =
    {
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
      7: "md:grid-cols-7",
      8: "md:grid-cols-8",
    }[totalCols] ?? "md:grid-cols-5";

  // ── Filter handlers (cascade reset) ───────────────────────────────────────
  const resetToFirstPage = () => setPage(1);

  const handleCircleChange = (value: string) => {
    const id = value === "" ? 0 : Number(value);
    setFilters((p) => ({
      ...p,
      circle_id: id,
      division_id: 0,
      sub_division_id: 0,
    }));
    resetToFirstPage();
  };

  const handleDivisionChange = (value: string) => {
    const id = value === "" ? 0 : Number(value);
    setFilters((p) => ({ ...p, division_id: id, sub_division_id: 0 }));
    resetToFirstPage();
  };

  const handleSubDivisionChange = (value: string) => {
    const id = value === "" ? 0 : Number(value);
    setFilters((p) => ({ ...p, sub_division_id: id }));
    resetToFirstPage();
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportExcel = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const allRows = await fetchAllPTWs({ search, filters });

      if (allRows.length === 0) {
        toast.info("No records match the current filters.");
        return;
      }

      const ExcelJS = (await import("exceljs")).default;

      const wb = new ExcelJS.Workbook();
      wb.creator = "PTW Dashboard";
      wb.created = new Date();

      const ws = wb.addWorksheet("PTW List", {
        views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
        pageSetup: {
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      });

      const headers = [
        "Sr",
        "PTW Code",
        "Work Order",
        "Type",
        "Feeder",
        "Sub Division",
        "LS",
        "SDO",
        "Feeder Incharge",
        "Scope of Work",
        "Place of Work",
        "Due Time",
        "Status",
        "Created At",
        "Updated At",
      ];
      const colCount = headers.length;

      const body = allRows.map((p, idx) => [
        idx + 1,
        p.ptw_code ?? "",
        p.work_order_no ?? "",
        p.type ?? "",
        p.feeder?.name ?? "",
        p.sub_division?.name ?? "",
        p.ls?.name ?? "",
        p.sdo?.name ?? "",
        p.feeder_incharge_name ?? "",
        p.scope_of_work ?? "",
        p.place_of_work ?? "",
        p.due_time ?? "",
        p.status_label_en ?? p.current_status ?? "",
        p.created_at ?? "",
        p.updated_at ?? "",
      ]);

      const BRAND_RED = "FFED1F27";
      const ZEBRA = "FFFDF2F2";
      const BORDER = "FFE5E7EB";

      ws.mergeCells(1, 1, 1, colCount);
      const title = ws.getCell(1, 1);
      title.value = "PTW List Report";
      title.font = {
        name: "Calibri",
        size: 18,
        bold: true,
        color: { argb: BRAND_RED },
      };
      title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(1).height = 32;

      ws.mergeCells(2, 1, 2, colCount);
      const sub = ws.getCell(2, 1);

      const periodParts: string[] = [];
      if (filters.from_date) periodParts.push(`from ${filters.from_date}`);
      if (filters.to_date) periodParts.push(`to ${filters.to_date}`);
      const periodStr = periodParts.length ? periodParts.join(" ") : "All dates";

      // Include active hierarchy filters in the summary
      const hierParts: string[] = [];
      if (filters.circle_id > 0) {
        const c = circleOptions.find((o) => o.id === filters.circle_id);
        if (c) hierParts.push(`Circle: ${c.name}`);
      }
      if (filters.division_id > 0) {
        const d = divisionOptions.find((o) => o.id === filters.division_id);
        if (d) hierParts.push(`Division: ${d.name}`);
      }
      if (filters.sub_division_id > 0) {
        const sd = subDivisionOptions.find(
          (o) => o.id === filters.sub_division_id,
        );
        if (sd) hierParts.push(`Sub Division: ${sd.name}`);
      }
      const hierStr = hierParts.length ? hierParts.join("  |  ") : "—";

      sub.value =
        `Filters → Status: ${filters.status || "All"}   |   ` +
        `Period: ${periodStr}   |   ` +
        `Hierarchy: ${hierStr}   |   ` +
        `Search: ${search || "—"}   |   ` +
        `Records: ${allRows.length}   |   ` +
        `Generated: ${new Date().toLocaleString()}`;
      sub.font = {
        name: "Calibri",
        size: 10,
        italic: true,
        color: { argb: "FF6B7280" },
      };
      sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(2).height = 20;
      ws.getRow(3).height = 8;

      const headerRow = ws.getRow(4);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: BRAND_RED },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: BRAND_RED } },
          bottom: { style: "medium", color: { argb: "FFB3141A" } },
          left: { style: "thin", color: { argb: "FFFFFFFF" } },
          right: { style: "thin", color: { argb: "FFFFFFFF" } },
        };
      });
      headerRow.height = 30;

      const centerCols = new Set([0, 3, 11, 12]);

      body.forEach((row, rIdx) => {
        const excelRow = ws.getRow(5 + rIdx);
        row.forEach((val, cIdx) => {
          const cell = excelRow.getCell(cIdx + 1);
          cell.value = val as ExcelJS.CellValue;
          cell.font = {
            name: "Calibri",
            size: 10.5,
            color: { argb: "FF1F2937" },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: centerCols.has(cIdx) ? "center" : "left",
            indent: centerCols.has(cIdx) ? 0 : 1,
            wrapText: false,
          };
          cell.border = {
            bottom: { style: "thin", color: { argb: BORDER } },
            left: { style: "thin", color: { argb: BORDER } },
            right: { style: "thin", color: { argb: BORDER } },
          };
          if (rIdx % 2 === 1) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: ZEBRA },
            };
          }
        });
        excelRow.height = 22;
      });

      headers.forEach((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...body.map((r) => String(r[i] ?? "").length),
        );
        ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 10), 40);
      });
      ws.getColumn(1).width = 8;

      ws.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4 + body.length, column: colCount },
      };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PTW_List_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${allRows.length} PTW record${allRows.length !== 1 ? "s" : ""}`,
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Failed to export PTWs");
    } finally {
      setIsExporting(false);
    }
  }, [
    isExporting,
    search,
    filters,
    circleOptions,
    divisionOptions,
    subDivisionOptions,
  ]);

  const columns = [
    { key: "ptw_code", label: "PTW Code" },
    { key: "work_order_no", label: "Work Order" },
    { key: "type", label: "Type" },
    {
      key: "feeder",
      label: "Feeder",
      render: (p: PTW) => p.feeder?.name ?? "—",
    },
    {
      key: "sub_division",
      label: "Sub Division",
      render: (p: PTW) => p.sub_division?.name ?? "—",
    },
    { key: "feeder_incharge_name", label: "Feeder Incharge" },
    {
      key: "current_status",
      label: "Status",
      render: (p: PTW) => {
        const color =
          p.status_label_en === "DRAFT"
            ? "bg-amber-100 text-amber-800"
            : p.status_label_en === "APPROVED"
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-600";
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
          >
            {p.status_label_en}
          </span>
        );
      },
      className: "text-center",
    },
  ];

  const actions = [
    {
      label: "View Preview",
      icon: "Eye" as const,
      onClick: (p: PTW) => navigate(`/ptw/${p.id}`),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-medium">PTW List</div>
          <div className="mt-1 text-sm text-slate-500">
            List of all PTWs in the system, with search, filters, and export
            options.
          </div>
        </div>
        <div className="mt-3 flex w-full justify-end gap-2 h-auto my-auto">
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({
                status: "",
                from_date: "",
                to_date: "",
                sort_by: "updated_at",
                sort_dir: "desc",
                circle_id: 0,
                division_id: 0,
                sub_division_id: 0,
              });
              resetToFirstPage();
            }}
          >
            Reset Filters
          </Button>

          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={isFetching || isExporting}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            onClick={exportExcel}
            disabled={isExporting || isFetching}
          >
            {isExporting ? (
              <>
                <Lucide icon="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Lucide icon="Download" className="w-4 h-4 mr-2" />
                Export Excel
              </>
            )}
          </Button>

          {userRoles.includes("LS") && (
            <Button variant="primary" onClick={() => navigate("/ptw")}>
              <Lucide icon="Plus" className="w-4 h-4 mr-2" />
              New PTW
            </Button>
          )}
        </div>
      </div>

      {/* Filters UI — hierarchy filters rendered based on can_filter */}
      <div className="rounded-lg border bg-white p-4">
        <div className={`grid grid-cols-1 gap-3 ${gridColsClass}`}>
          {/* ── Circle (only if can_filter.circle) ────────────────────── */}
          {canFilter.circle && (
            <div>
              <label className="text-xs text-slate-600">Circle</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 disabled:opacity-60"
                value={filters.circle_id > 0 ? String(filters.circle_id) : ""}
                onChange={(e) => handleCircleChange(e.target.value)}
                disabled={isFetching && circleOptions.length === 0}
              >
                <option value="">
                  {circleOptions.length === 0 ? "No circles available" : "All Circles"}
                </option>
                {circleOptions.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Division (only if can_filter.division) ────────────────── */}
          {canFilter.division && (
            <div>
              <label className="text-xs text-slate-600">Division</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 disabled:opacity-60"
                value={
                  filters.division_id > 0 ? String(filters.division_id) : ""
                }
                onChange={(e) => handleDivisionChange(e.target.value)}
                disabled={isFetching && divisionOptions.length === 0}
              >
                <option value="">
                  {divisionOptions.length === 0
                    ? "No divisions available"
                    : "All Divisions"}
                </option>
                {divisionOptions.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Sub Division (only if can_filter.sub_division) ────────── */}
          {canFilter.sub_division && (
            <div>
              <label className="text-xs text-slate-600">Sub Division</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 disabled:opacity-60"
                value={
                  filters.sub_division_id > 0
                    ? String(filters.sub_division_id)
                    : ""
                }
                onChange={(e) => handleSubDivisionChange(e.target.value)}
                disabled={isFetching && subDivisionOptions.length === 0}
              >
                <option value="">
                  {subDivisionOptions.length === 0
                    ? "No sub divisions available"
                    : "All Sub Divisions"}
                </option>
                {subDivisionOptions.map((sd) => (
                  <option key={sd.id} value={String(sd.id)}>
                    {sd.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Status ────────────────────────────────────────────────── */}
          <div>
            <label className="text-xs text-slate-600">Status</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
              value={filters.status}
              onChange={(e) => {
                setFilters((p) => ({ ...p, status: e.target.value }));
                resetToFirstPage();
              }}
            >
              <option value="">All Statuses</option>
              {PTW_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* ── From Date ─────────────────────────────────────────────── */}
          <div>
            <label className="text-xs text-slate-600">From Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
              value={filters.from_date}
              onChange={(e) => {
                setFilters((p) => ({ ...p, from_date: e.target.value }));
                resetToFirstPage();
              }}
            />
          </div>

          {/* ── To Date ───────────────────────────────────────────────── */}
          <div>
            <label className="text-xs text-slate-600">To Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
              value={filters.to_date}
              onChange={(e) => {
                setFilters((p) => ({ ...p, to_date: e.target.value }));
                resetToFirstPage();
              }}
            />
          </div>

          {/* ── Sort By ───────────────────────────────────────────────── */}
          <div>
            <label className="text-xs text-slate-600">Sort By</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
              value={filters.sort_by}
              onChange={(e) => {
                setFilters((p) => ({ ...p, sort_by: e.target.value }));
                resetToFirstPage();
              }}
            >
              <option value="updated_at">updated_at</option>
              <option value="created_at">created_at</option>
              <option value="ptw_code">ptw_code</option>
            </select>
          </div>

          {/* ── Sort Dir ──────────────────────────────────────────────── */}
          <div>
            <label className="text-xs text-slate-600">Sort Dir</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
              value={filters.sort_dir}
              onChange={(e) => {
                setFilters((p) => ({
                  ...p,
                  sort_dir: e.target.value as "asc" | "desc",
                }));
                resetToFirstPage();
              }}
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </div>
        </div>
      </div>

      <GenericTable
        title="PTW List"
        data={ptws}
        columns={columns}
        actions={actions}
        loading={isFetching}
        error={isError ? "Failed to load PTW list" : null}
        onRetry={refetch}
        page={page}
        perPage={perPage}
        total={total}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />
    </div>
  );
}