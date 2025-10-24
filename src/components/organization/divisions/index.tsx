"use client";

import { GenericTable, type TableAction } from "@/components/Base/GenericTable";
import { StatusBadge } from "@/components/Base/StatusBadge";

interface Division {
  id: number;
  circle_id: number;
  code: string;
  name: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function DivisionsListPage() {
  const divisions: Division[] = [
    {
      id: 1,
      circle_id: 1,
      code: "D001",
      name: "Khanewal Division Updated",
      is_active: true,
      deleted_at: null,
      created_at: "2025-10-23T08:17:14.000Z",
      updated_at: "2025-10-23T08:19:51.000Z",
    },
  ];

  // 🔹 Define columns
  const columns = [
    { key: "name", label: "Division Name" },
    { key: "code", label: "Code" },
    {
      key: "is_active",
      label: "Status",
      render: (r: Division) => <StatusBadge active={r.is_active} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (r: Division) =>
        new Date(r.updated_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  // 🔹 Define actions
  const actions: TableAction<Division>[] = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (r) => alert(`Viewing division: ${r.name}`),
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r) => alert(`Editing division: ${r.name}`),
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger",
      onClick: (r) => alert(`Deleting division: ${r.name}`),
    },
  ];

  return (
    <div className="p-6 space-y-6">
         <div className="intro-y">
        <h1 className="text-2xl font-semibold leading-5 ">Divisions</h1>
      </div>
      <GenericTable
        data={divisions}
        columns={columns}
        actions={actions}
        title="Divisions List"
        searchable
        showPagination
      />
    </div>
  );
}
