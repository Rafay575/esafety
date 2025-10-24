"use client";

import { GenericTable, type TableAction } from "@/components/Base/GenericTable";
import { StatusBadge } from "@/components/Base/StatusBadge";

interface Feeder {
  id: number;
  sub_division_id: number;
  code: string;
  name: string;
  voltage_level: string;
  lat: number;
  lng: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function FeedersListPage() {
  const feeders: Feeder[] = [
    {
      id: 1,
      sub_division_id: 1,
      code: "F002",
      name: "Main City Feeders",
      voltage_level: "11kV",
      lat: 30.1527,
      lng: 71.5224,
      is_active: true,
      deleted_at: null,
      created_at: "2025-10-23T09:14:23.000Z",
      updated_at: "2025-10-23T09:31:48.000Z",
    },
  ];

  // 🔹 Table columns
  const columns = [
    { key: "name", label: "Feeder Name" },
    { key: "code", label: "Code" },
    { key: "voltage_level", label: "Voltage Level" },
    {
      key: "is_active",
      label: "Status",
      render: (r: Feeder) => <StatusBadge active={r.is_active} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (r: Feeder) =>
        new Date(r.updated_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  // 🔹 Dropdown actions
  const actions: TableAction<Feeder>[] = [
    {
      label: "View",
      icon: "Eye" as const,
      onClick: (r) => alert(`Viewing feeder: ${r.name}`),
    },
    {
      label: "Edit",
      icon: "PencilLine" as const,
      onClick: (r) => alert(`Editing feeder: ${r.name}`),
    },
    {
      label: "Delete",
      icon: "Trash2" as const,
      variant: "danger",
      onClick: (r) => alert(`Deleting feeder: ${r.name}`),
    },
  ];

  return (
    <div className="p-6 space-y-6">
          <div className="intro-y">
        <h1 className="text-2xl font-semibold leading-5 ">Feeders</h1>
      </div>
      <GenericTable
        data={feeders}
        columns={columns}
        actions={actions}
        title="Feeders List"
        searchable
        showPagination
      />
    </div>
  );
}
