import { GenericTable, type TableAction } from "@/components/Base/GenericTable";
import { StatusBadge } from "@/components/Base/StatusBadge";

interface Circle {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  updated_at: string;
}

export default function CirclesPage() {
  const circles: Circle[] = [
    { id: "1", name: "Lahore Circle", code: "C001", is_active: true, updated_at: "45 min ago" },
    { id: "2", name: "Multan Circle", code: "C002", is_active: false, updated_at: "2 hours ago" },
    // add more dummy data to test pagination
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    {
      key: "is_active",
      label: "Status",
      render: (r: Circle) => <StatusBadge active={r.is_active} />,
    },
    { key: "updated_at", label: "Updated" },
  ];

  const actions: TableAction<Circle>[] = [
    { label: "View", icon: "Eye" as const, onClick: (r: Circle) => alert("View " + r.name) },
    { label: "Edit", icon: "PencilLine" as const, onClick: (r: Circle) => alert("Edit " + r.name) },
    { label: "Delete", icon: "Trash2" as const, variant: "danger", onClick: (r: Circle) => alert("Delete " + r.name) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="intro-y">
        <h1 className="text-2xl font-semibold leading-5 ">Circles</h1>
      </div>
      <GenericTable
        data={circles}
        columns={columns}
        actions={actions}
        title="Circles List"
        searchable
        showPagination
      />
    </div>
  );
}
