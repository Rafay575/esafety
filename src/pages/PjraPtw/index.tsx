"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { GenericTable } from "@/components/Base/GenericTable";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";

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
  feeder?: { id: number; name: string; code: string };
  sub_division?: { id: number; name: string };
  ls?: { id: number; name: string };
  sdo?: { id: number; name: string };
  created_at: string;
  updated_at: string;
};

type PTWResponse = {
  message: string;
  data: {
    data: PTW[];
    total: number;
    current_page: number;
    per_page: number;
  };
};

// Fetch PTW list
async function getPTWs({ page, perPage, search }: { page: number; perPage: number; search: string }) {
  try {
    const { data } = await api.get<PTWResponse>("/api/v1/ptw", {
      params: { page, per_page: perPage, q: search },
    });
    return data.data;
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to load PTWs");
    throw err;
  }
}

export default function PTWListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const navigate = useNavigate()
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["ptw", page, perPage, search],
    queryFn: () => getPTWs({ page, perPage, search }),
  });
const authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
const userRoles: string[] = authUser?.roles ?? [];
  const ptws = data?.data ?? [];
  const total = data?.total ?? 0;

  // ---------- Columns ----------
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
    // {
    //   key: "scheduled_start_at",
    //   label: "Scheduled Start",
    //   render: (p: PTW) =>
    //     p.scheduled_start_at
    //       ? new Date(p.scheduled_start_at).toLocaleString("en-US", {
    //           dateStyle: "medium",
    //           timeStyle: "short",
    //         })
    //       : "—",
    // },
    {
      key: "current_status",
      label: "Status",
      render: (p: PTW) => {
        const color =
          p.current_status === "DRAFT"
            ? "bg-amber-100 text-amber-800"
            : p.current_status === "APPROVED"
            ? "bg-green-100 text-green-800"
            : "bg-slate-100 text-slate-600";
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
          >
            {p.current_status}
          </span>
        );
      },
      className: "text-center",
    },
    // {
    //   key: "updated_at",
    //   label: "Updated",
    //   render: (p: PTW) =>
    //     new Date(p.updated_at).toLocaleString("en-US", {
    //       dateStyle: "medium",
    //       timeStyle: "short",
    //     }),
    // },
  ];

  // ---------- Row Actions ----------
  const actions = [
    {
      label: "View Preview",
      icon: "Eye" as const,
      onClick: (p: PTW) => {
        navigate(`/ptw/${p.id}`);
      },
    },
  
  ];

  return (
    <div className="p-6 space-y-6">
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
         toolbarActions={
        <Button
          variant="primary"
          onClick={() => {
            if (userRoles.includes("LS")) {
              navigate("/ptw");
            } else {
              toast.error(`Not allowed for role: ${userRoles.join(", ") || "Unknown"}`);
            }
          }}
        >
          <Lucide icon="Plus" className="w-4 h-4 mr-2" />
          New PTW
        </Button>
      }
      />
    </div>
  );
}
