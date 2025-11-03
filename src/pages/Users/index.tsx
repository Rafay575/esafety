// src/pages/users/UsersListPage.tsx
"use client";

import React from "react";
import { GenericTable, Column, TableAction } from "@/components/Base/GenericTable";
import { useUsers, useDebouncedValue, type OrgUserRow } from "./hooks";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";

export default function UsersListPage() {
  const navigate = useNavigate();

  // UI state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10); // <- default per_page
  const [search, setSearch] = React.useState("");

  // Debounce search to reduce API spam
  const debouncedSearch = useDebouncedValue(search, 400);

  // Reset page when search/perPage changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage]);

  // Fetch
  const { data, isLoading, isError, refetch } = useUsers(page, perPage, debouncedSearch);
  const users = (data?.rows ?? []) as OrgUserRow[];
  const total = data?.meta?.total ?? 0;

  // Columns
  const columns: Column<OrgUserRow>[] = React.useMemo(
    () => [
      {
        key: "userCode",
        label: "User Code",
        render: (row) => <span className="font-medium text-slate-800">{row.userCode}</span>,
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
        render: (row) => <span className="truncate block max-w-[220px]">{row.email}</span>,
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
    []
  );

  // Actions (icons must match GenericTable's union)
  const actions: TableAction<OrgUserRow>[] = React.useMemo(
    () => [
      {
        label: "Edit",
        icon: "PencilLine",
        onClick: (row) => navigate(`/users/${row.id}/edit`),
      },
      {
        label: "Deactivate",
        icon: "Trash2",
        variant: "danger",
        onClick: (row) => alert(`Deactivate user ${row.name} (ID: ${row.id})`),
      },
    ],
    [navigate]
  );

  // Toolbar
  const toolbarActions = (
    <Button variant="primary" onClick={() => navigate("/users/add")} className="shadow-sm">
      <Lucide icon="UserPlus" className="w-4 h-4 mr-2" /> Add User
    </Button>
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
      // 🔻 API-driven pagination + search (wired to your hook)
      page={page}
      perPage={perPage}
      total={total}
      search={search}
      onSearchChange={setSearch}
      onPageChange={setPage}
      onPerPageChange={setPerPage}
      />
      </div>
  );
}
