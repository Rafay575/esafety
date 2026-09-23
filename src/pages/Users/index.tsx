// src/pages/users/UsersListPage.tsx
"use client";

import React, { useCallback, useState } from "react";
import {
  GenericTable,
  Column,
  TableAction,
} from "@/components/Base/GenericTable";
import {
  useUsers,
  useDebouncedValue,
  useRoles,
  type OrgUserRow,
} from "./hooks";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import ExcelJS from "exceljs";
// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch every user matching the current search + role filter,
 * walking paginated responses until we've collected them all.
 */
async function fetchAllUsers(params: {
  search?: string;
  role?: string;
}): Promise<OrgUserRow[]> {
  const BATCH = 500;
  const MAX_PAGES = 200; // safety cap → 100k rows max

  let page = 1;
  let all: any[] = [];
  let total = Infinity;

  while (page <= MAX_PAGES && all.length < total) {
    const { data } = await api.get("/api/v1/users", {
      params: {
        page,
        per_page: BATCH,
        search: params.search || undefined,
        role: params.role || undefined,
      },
    });

    const block = data?.data ?? [];
    if (!block.length) break;

    all = all.concat(block);
    total = data?.total ?? all.length;
    page += 1;
  }

  return all.map((u: any) => ({
    id: u.id,
    sap_code: u.sap_code ?? "",
    name: u.name ?? "—",
    email: u.email ?? "—",
    phone: u.phone ?? "—",
    designation: u.designation_name ?? u.designation?.name ?? "—",
    role: (u.roles?.[0]?.name as string) ?? "—",
    status: u.is_active ? "Active" : "Inactive",
    updatedAt: u.updated_at ?? u.created_at ?? new Date().toISOString(),
  }));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function UsersListPage() {
  const navigate = useNavigate();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Modal state
  const [userToToggle, setUserToToggle] = useState<OrgUserRow | null>(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);

  // UI state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("");

  const debouncedSearch = useDebouncedValue(search, 400);

  // Roles for filter dropdown
  const { data: roles, isLoading: isLoadingRoles } = useRoles();

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage, roleFilter]);

  const { data, isLoading, isError, refetch } = useUsers(
    page,
    perPage,
    debouncedSearch,
    roleFilter || undefined,
  );
  const users = (data?.rows ?? []) as OrgUserRow[];
  const total = data?.meta?.total ?? 0;

  // ── Export handler ─────────────────────────────────────────────────────
  const handleExportExcel = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    const toastId = toast.loading("Preparing export…");

    try {
      // 1. Fetch EVERY user matching current filters (not just the page)
      const allRows = await fetchAllUsers({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      });

      if (allRows.length === 0) {
        toast.error("No users match the current filters.", { id: toastId });
        return;
      }

      // 2. Lazy-load ExcelJS (keeps it out of the main bundle)
      const ExcelJS = (await import("exceljs")).default;

      const wb = new ExcelJS.Workbook();
      wb.creator = "Flexi HR";
      wb.created = new Date();

      const ws = wb.addWorksheet("Users", {
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
        "User Code",
        "Name",
        "Designation",
        "Email",
        "Phone",
        "Role",
        "Status",
        "Updated At",
      ];
      const colCount = headers.length;

      const body = allRows.map((u, idx) => [
        idx + 1,
        u.sap_code,
        u.name,
        u.designation,
        u.email,
        u.phone,
        u.role,
        u.status,
        new Date(u.updatedAt).toLocaleString(),
      ]);

      const BRAND_RED = "FFED1F27";
      const ZEBRA = "FFFDF2F2";
      const BORDER = "FFE5E7EB";

      // ── Title banner ─────────────────────────────────────────
      ws.mergeCells(1, 1, 1, colCount);
      const title = ws.getCell(1, 1);
      title.value = "Users Export";
      title.font = {
        name: "Calibri",
        size: 18,
        bold: true,
        color: { argb: BRAND_RED },
      };
      title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(1).height = 32;

      // ── Filter summary ──────────────────────────────────────
      ws.mergeCells(2, 1, 2, colCount);
      const sub = ws.getCell(2, 1);
      const filterParts: string[] = [];
      if (debouncedSearch) filterParts.push(`Search: "${debouncedSearch}"`);
      if (roleFilter) filterParts.push(`Role: ${roleFilter}`);
      const filterStr = filterParts.length
        ? filterParts.join("   |   ")
        : "No filters";

      sub.value =
        `${filterStr}   |   Records: ${allRows.length}   |   ` +
        `Generated: ${new Date().toLocaleString()}`;
      sub.font = {
        name: "Calibri",
        size: 10,
        italic: true,
        color: { argb: "FF6B7280" },
      };
      sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(2).height = 20;

      ws.getRow(3).height = 8; // spacer

      // ── Header row (row 4) ──────────────────────────────────
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
      headerRow.height = 28;

      // ── Body rows ───────────────────────────────────────────
      // Centered columns: Sr, Status
      const centerCols = new Set([0, 7]);

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

      // ── Auto column widths ──────────────────────────────────
      headers.forEach((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...body.map((r) => String(r[i] ?? "").length),
        );
        ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 10), 40);
      });
      ws.getColumn(1).width = 8; // Sr stays narrow

      // ── Filter dropdowns on header row ──────────────────────
      ws.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4 + body.length, column: colCount },
      };

      // ── Download ────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Users_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${allRows.length} user${allRows.length !== 1 ? "s" : ""}`,
        { id: toastId },
      );
    } catch (err: any) {
      console.error("Export failed:", err);
      toast.error(
        err?.response?.data?.message ?? "Failed to export users.",
        { id: toastId },
      );
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, debouncedSearch, roleFilter]);

  // ── Toggle user ────────────────────────────────────────────────────────
  const openToggleModal = (user: OrgUserRow) => {
    setUserToToggle(user);
    setIsToggleModalOpen(true);
  };

  const closeToggleModal = () => {
    setUserToToggle(null);
    setIsToggleModalOpen(false);
  };

  const handleToggleConfirm = async () => {
    if (!userToToggle) return;

    const action = userToToggle.status === "Active" ? "deactivate" : "activate";
    setTogglingId(userToToggle.id);
    try {
      await api.post(`/api/v1/users/${userToToggle.id}/toggle`);
      toast.success(`User ${action}d successfully`);
      closeToggleModal();
      refetch();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || `Failed to ${action} user`,
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────
  const columns: Column<OrgUserRow>[] = React.useMemo(
    () => [
      {
        key: "userCode",
        label: "User Code",
        render: (row) => (
          <span className="font-medium text-slate-800">{row.sap_code}</span>
        ),
      },
      {
        key: "name",
        label: "Name",
        render: (row) => (
          <div className="flex items-center gap-2">
            <div>
              <div className="font-semibold text-slate-800">{row.name}</div>
              <div className="text-xs text-slate-500">{row.designation}</div>
            </div>
          </div>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (row) => (
          <span className="truncate block max-w-[220px]">{row.email}</span>
        ),
      },
      { key: "phone", label: "Phone" },
      {
        key: "role",
        label: "Role",
        render: (row) => (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 rounded-full px-2 py-1 text-[11px]">
            <Lucide icon="Shield" className="w-3.5 h-3.5" /> {row.role}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset " +
              (row.status === "Active"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-rose-200")
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (row.status === "Active" ? "bg-emerald-500" : "bg-rose-500")
              }
            />
            {row.status}
          </span>
        ),
      },
      {
        key: "updatedAt",
        label: "Updated",
        render: (row) =>
          new Date(row.updatedAt).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
    ],
    [],
  );

  // ── Actions ────────────────────────────────────────────────────────────
  const actions: TableAction<OrgUserRow>[] = React.useMemo(
    () => [
      {
        label: "View",
        icon: "Eye",
        onClick: (row) => navigate(`/users/${row.id}`),
      },
      {
        label: "Edit",
        icon: "PencilLine",
        onClick: (row) => navigate(`/users/${row.id}/edit`),
      },
      {
        label: "Toggle Active",
        icon: "Power",
        onClick: (row) => openToggleModal(row),
      },
    ],
    [navigate],
  );

  // ── Toolbar ────────────────────────────────────────────────────────────
  const toolbarActions = (
    <div className="flex items-center gap-2">
      {/* Role filter */}
      <div className="relative">
        <Lucide
          icon="Shield"
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        />
        <select
          className="h-9 w-[180px] rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          disabled={isLoadingRoles}
          title="Filter by role"
        >
          <option value="">All Roles</option>
          {isLoadingRoles && <option disabled>Loading roles...</option>}
          {(roles ?? []).map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <Lucide
          icon="ChevronDown"
          className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        />
      </div>

      {/* Clear filter */}
      {roleFilter && (
        <button
          type="button"
          onClick={() => setRoleFilter("")}
          className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          title="Clear role filter"
        >
          <Lucide icon="X" className="h-3.5 w-3.5" />
          Clear
        </button>
      )}

      {/* Export button */}
      <Button
        variant="outline-secondary"
        onClick={handleExportExcel}
        disabled={isExporting || isLoading}
        className="flex items-center gap-2 shadow-sm"
      >
        {isExporting ? (
          <>
            <Loader className="animate-spin" size={16} />
            Exporting…
          </>
        ) : (
          <>
            <Lucide icon="Download" className="w-4 h-4" />
            Export
          </>
        )}
      </Button>

      {/* Add User */}
      <Button
        variant="primary"
        onClick={() => navigate("/users/add")}
        className="shadow-sm"
      >
        <Lucide icon="UserPlus" className="w-4 h-4 mr-2" /> Add User
      </Button>
    </div>
  );

  return (
    <div className="my-5">
      <GenericTable
        title="Organization & Users"
        data={users}
        columns={columns}
        actions={actions}
        loading={isLoading}
        error={isError ? "Failed to load users." : null}
        onRetry={() => refetch()}
        toolbarActions={toolbarActions}
        page={page}
        perPage={perPage}
        total={total}
        search={search}
        onSearchChange={setSearch}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      {/* Toggle Confirmation Modal */}
      {isToggleModalOpen && userToToggle && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-0 !mt-0"
          style={{ zIndex: 9999 }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Lucide icon="AlertTriangle" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {userToToggle.status === "Active"
                    ? "Deactivate User"
                    : "Activate User"}
                </h3>
              </div>
              <button
                onClick={closeToggleModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Lucide icon="X" className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Are you sure you want to{" "}
              {userToToggle.status === "Active" ? "deactivate" : "activate"}{" "}
              <span className="font-semibold">{userToToggle.name}</span>? This
              will change their access status immediately.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline-secondary" onClick={closeToggleModal}>
                Cancel
              </Button>
              <Button
                variant={
                  userToToggle.status === "Active" ? "danger" : "primary"
                }
                onClick={handleToggleConfirm}
                disabled={togglingId === userToToggle.id}
                className="flex items-center gap-2"
              >
                {togglingId === userToToggle.id ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Lucide icon="Power" className="h-4 w-4" />
                )}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}