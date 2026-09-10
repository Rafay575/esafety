// src/pages/users/UsersListPage.tsx
"use client";

import React, { useCallback, useState } from "react";
import { GenericTable, Column, TableAction } from "@/components/Base/GenericTable";
import { useUsers, useDebouncedValue, type OrgUserRow } from "./hooks";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";

export default function UsersListPage() {
  const navigate = useNavigate();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal state
  const [userToToggle, setUserToToggle] = useState<OrgUserRow | null>(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);

  // UI state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [search, setSearch] = React.useState("");

  const debouncedSearch = useDebouncedValue(search, 400);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage]);

  const { data, isLoading, isError, refetch } = useUsers(page, perPage, debouncedSearch);
  const users = (data?.rows ?? []) as OrgUserRow[];
  const total = data?.meta?.total ?? 0;

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
      toast.error(err?.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setTogglingId(null);
    }
  };

  // Columns
  const columns: Column<OrgUserRow>[] = React.useMemo(
    () => [
      {
        key: "userCode",
        label: "User Code",
        render: (row) => <span className="font-medium text-slate-800">{row.sap_code}</span>,
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

  // Actions
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-0 !mt-0" style={{ zIndex: 9999 }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Lucide icon="AlertTriangle" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {userToToggle.status === "Active" ? "Deactivate User" : "Activate User"}
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
              Are you sure you want to {userToToggle.status === "Active" ? "deactivate" : "activate"}{" "}
              <span className="font-semibold">{userToToggle.name}</span>?
              This will change their access status immediately.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline-secondary" onClick={closeToggleModal}>
                Cancel
              </Button>
              <Button
                variant={userToToggle.status === "Active" ? "danger" : "primary"}
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