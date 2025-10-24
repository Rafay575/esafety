"use client";

import { GenericTable, type TableAction } from "@/components/Base/GenericTable";
import { StatusBadge } from "@/components/Base/StatusBadge";

interface SubDivision {
  id: number;
  division_id: number;
  code: string;
  name: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function SubDivisionsListPage() {
  const subDivisions: SubDivision[] = [
    {
      id: 1,
      division_id: 1,
      code: "SD001",
      name: "Kabirwala Sub-Division Updated",
      is_active: true,
      deleted_at: null,
      created_at: "2025-10-23T08:25:36.000Z",
      updated_at: "2025-10-23T08:25:56.000Z",
    },
  ];

  // 🔹 Define columns
  const columns = [
    { key: "name", label: "Sub-Division Name" },
    { key: "code", label: "Code" },
    {
      key: "is_active",
      label: "Status",
      render: (r: SubDivision) => <StatusBadge active={r.is_active} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (r: SubDivision) =>
        new Date(r.updated_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  // 🔹 Define actions
  const actions: TableAction<SubDivision>[] = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (r) => alert(`Viewing Sub-Division: ${r.name}`),
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r) => alert(`Editing Sub-Division: ${r.name}`),
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger",
      onClick: (r) => alert(`Deleting Sub-Division: ${r.name}`),
    },
  ];

  return (
    <div className="p-6 space-y-6">
          <div className="intro-y">
        <h1 className="text-2xl font-semibold leading-5 ">Sub Divisions</h1>
      </div>
      <GenericTable
        data={subDivisions}
        columns={columns}
        actions={actions}
        title="Sub-Divisions List"
        searchable
        showPagination
      />
    </div>
  );
}
