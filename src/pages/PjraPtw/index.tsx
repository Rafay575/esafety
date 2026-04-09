"use client";

import { useMemo, useState } from "react";
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

type PTWFilters = {
  status: string; // (as per your API screenshot)
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  sort_by: string; // e.g. updated_at
  sort_dir: "asc" | "desc";
};

async function getPTWs(args: {
  page: number;
  perPage: number;
  search: string;
  filters: PTWFilters;
}) {
  const { page, perPage, search, filters } = args;

  try {
    const { data } = await api.get<PTWResponse>("/api/v1/ptw", {
      params: {
        page,
        per_page: perPage,
        search: search,

        // ✅ API filters (only send if value exists)
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.from_date ? { from_date: filters.from_date } : {}),
        ...(filters.to_date ? { to_date: filters.to_date } : {}),
        ...(filters.sort_by ? { sort_by: filters.sort_by } : {}),
        ...(filters.sort_dir ? { sort_dir: filters.sort_dir } : {}),
      },
    });

    return data.data;
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to load PTWs");
    throw err;
  }
}
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
export default function PTWListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // ✅ Filters
  const [filters, setFilters] = useState<PTWFilters>({
    status: "",
    from_date: "",
    to_date: "",
    sort_by: "updated_at",
    sort_dir: "desc",
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
  ];

  const actions = [
    {
      label: "View Preview",
      icon: "Eye" as const,
      onClick: (p: PTW) => navigate(`/ptw/${p.id}`),
    },
  ];

  const resetToFirstPage = () => setPage(1);

  return (
    <div className="p-6 space-y-4">
      {/* ✅ Filters UI */}
        <div className="mt-3 flex w-full justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({
                status: "",
                from_date: "",
                to_date: "",
                sort_by: "updated_at",
                sort_dir: "desc",
              });
              resetToFirstPage();
            }}
          >
            Reset Filters
          </Button>

          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
            <Button
            variant="primary"
            onClick={() => {
              if (userRoles.includes("LS")) navigate("/ptw");
              else
                toast.error(
                  `Not allowed for role: ${userRoles.join(", ") || "Unknown"}`,
                );
            }}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            New PTW
          </Button>
        </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {/* status */}
          <div>
            <label className="text-xs text-slate-600">Status </label>
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

          {/* from_date */}
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

          {/* to_date */}
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

          {/* sort_by */}
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

          {/* sort_dir */}
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

      {/* ✅ Table */}
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
        // toolbarActions={
        //   <Button
        //     variant="primary"
        //     onClick={() => {
        //       if (userRoles.includes("LS")) navigate("/ptw");
        //       else
        //         toast.error(
        //           `Not allowed for role: ${userRoles.join(", ") || "Unknown"}`,
        //         );
        //     }}
        //   >
        //     <Lucide icon="Plus" className="w-4 h-4 mr-2" />
        //     New PTW
        //   </Button>
        // }
      />
    </div>
  );
}
