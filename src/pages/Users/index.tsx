import { useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu } from "@/components/Base/Headless";
import {useNavigate} from "react-router-dom";
// --- Types ---
export type OrgUnit = {
  region: string;
  circle: string;
  division: string;
  subdivision: string;
};

export type OrgUser = {
  id: string; // User ID (auto, read-only)
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  status: "Active" | "Inactive";
  orgUnit: OrgUnit;
  updatedAt: string; // ISO or friendly date string
};

// --- Mock Data (replace with API later) ---
const MOCK_USERS: OrgUser[] = [
  {
    id: "USR-0001",
    fullName: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    phone: "+92 300 1234567",
    designation: "Assistant Manager",
    role: "Admin",
    status: "Active",
    orgUnit: {
      region: "Punjab",
      circle: "Lahore Circle",
      division: "Gulberg Division",
      subdivision: "Block A",
    },
    updatedAt: "2025-09-18 14:22",
  },
  {
    id: "USR-0002",
    fullName: "Bilal Ahmed",
    email: "bilal.ahmed@example.com",
    phone: "+92 333 9876543",
    designation: "Line Superintendent",
    role: "Manager",
    status: "Inactive",
    orgUnit: {
      region: "Sindh",
      circle: "Karachi Circle",
      division: "DHA Division",
      subdivision: "Phase 4",
    },
    updatedAt: "2025-09-18 09:05",
  },
  {
    id: "USR-0003",
    fullName: "Hira Siddiqui",
    email: "hira.siddiqui@example.com",
    phone: "+92 321 5551122",
    designation: "SSE",
    role: "Operator",
    status: "Active",
    orgUnit: {
      region: "KPK",
      circle: "Peshawar Circle",
      division: "Hayatabad Division",
      subdivision: "Sector F-8",
    },
    updatedAt: "2025-09-17 17:41",
  },
  {
    id: "USR-0004",
    fullName: "Umer Farooq",
    email: "umer.farooq@example.com",
    phone: "+92 307 7778899",
    designation: "Assistant Engineer",
    role: "Viewer",
    status: "Active",
    orgUnit: {
      region: "Punjab",
      circle: "Rawalpindi Circle",
      division: "Satellite Town",
      subdivision: "Block B",
    },
    updatedAt: "2025-09-16 11:03",
  },
];

// --- Component ---
const OrganizationUsersPage = () => {
  // Filters
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [orgRegion, setOrgRegion] = useState("all");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
  const navigate = useNavigate();
  // Pagination (client-side demo)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const regions = useMemo(() => {
    const all = Array.from(new Set(MOCK_USERS.map((u) => u.orgUnit.region))).sort();
    return all;
  }, []);

  const roles = useMemo(() => {
    const all = Array.from(new Set(MOCK_USERS.map((u) => u.role))).sort();
    return all;
  }, []);

  const filtered = useMemo(() => {
    let rows = [...MOCK_USERS];

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    if (role !== "all") rows = rows.filter((r) => r.role === role);
    if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (orgRegion !== "all") rows = rows.filter((r) => r.orgUnit.region === orgRegion);

    return rows;
  }, [query, role, status, orgRegion]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  // --- Handlers (wire up to API later) ---
  const onAddUser = () => {
    // open modal / navigate
    navigate("/users/add");
    console.log("Add User clicked");
  };
  const onEdit = (u: OrgUser) => console.log("Edit", u.id);
  const onDeactivate = (u: OrgUser) => console.log("Deactivate", u.id);
  const onResetPassword = (u: OrgUser) => console.log("Reset Password", u.id);
  const onAssignRole = (u: OrgUser) => console.log("Assign Role", u.id);

  // Density helpers
  const cellY = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header / Actions */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">Organization & Users</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <FormSelect
              className="!w-36"
              value={density}
              onChange={(e) => setDensity(e.target.value as any)}
              title="Row density"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
          <Button variant="primary" onClick={onAddUser} className="shadow-sm">
            <Lucide icon="UserPlus" className="w-4 h-4 mr-2" /> Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 bg-gradient-to-b from-white to-slate-50 dark:from-darkmode-700 dark:to-darkmode-600">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-3">
              <div className="relative text-slate-500">
                <Lucide icon="Search" className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4" />
                <FormInput
                  className="pl-9"
                  placeholder="Search by name, email, phone, or ID"
                  value={query}
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect
                value={role}
                onChange={(e) => {
                  setPage(1);
                  setRole(e.target.value);
                }}
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect
                value={orgRegion}
                onChange={(e) => {
                  setPage(1);
                  setOrgRegion(e.target.value);
                }}
              >
                <option value="all">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2">
              <FormSelect
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-1 flex items-center">
              <Button
                variant="outline-secondary"
                className="w-full"
                onClick={() => {
                  setQuery("");
                  setRole("all");
                  setStatus("all");
                  setOrgRegion("all");
                  setPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-span-12 intro-y">
        <div className="box p-0 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300 overflow-hidden">
          <div className="overflow-auto">
            <Table className="table-auto w-full">
              <Table.Thead>
                <Table.Tr>
                  {[
                    "SR",
                    "User ID",
                    "Name",
                    "Email",
                    "Phone",
                    "Role",
                    "Org Unit",
                    "Status",
                    "Updated",
                    "Actions",
                  ].map((h, idx) => (
                    <Table.Th
                      key={h}
                      className={
                        "sticky top-0 z-10 bg-white/80 dark:bg-darkmode-700/80 backdrop-blur supports-backdrop-blur:backdrop-blur text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide px-5 py-3 border-b border-slate-200/70 dark:border-darkmode-400" +
                        (idx === 0 ? " w-14 text-center" : "") +
                        (h === "Actions" ? " text-center" : "")
                      }
                    >
                      {h}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {paged.map((u, i) => {
                  const sr = (pageSafe - 1) * pageSize + i + 1;
                  return (
                    <Table.Tr
                      key={u.id}
                      className={clsx(
                        "group transition-all duration-200",
                        density === "compact" ? "text-[13px]" : "text-sm"
                      )}
                    >
                      {/* SR */}
                      <Table.Td className={clsx("px-5", cellY, "text-center text-slate-500")}>{sr}</Table.Td>

                      {/* User ID */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{u.id}</span>
                      </Table.Td>

                      {/* Name */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <div className="font-medium text-slate-800 dark:text-slate-100">{u.fullName}</div>
                        <div className="text-xs text-slate-500">{u.designation}</div>
                      </Table.Td>

                      {/* Email */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <Tippy as="span" content={u.email}>
                          <span className="truncate block max-w-[240px]">{u.email}</span>
                        </Tippy>
                      </Table.Td>

                      {/* Phone */}
                      <Table.Td className={clsx("px-5", cellY)}>{u.phone}</Table.Td>

                      {/* Role */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] bg-slate-100 dark:bg-darkmode-400 text-slate-700 dark:text-slate-200">
                          <Lucide icon="Shield" className="w-3.5 h-3.5" /> {u.role}
                        </span>
                      </Table.Td>

                      {/* Org Unit */}
                      <Table.Td className={clsx("px-5", cellY)}>
                        <div className="text-slate-700 dark:text-slate-300">
                          {u.orgUnit.region} • {u.orgUnit.circle}
                        </div>
                        <div className="text-xs text-slate-500">
                          {u.orgUnit.division} / {u.orgUnit.subdivision}
                        </div>
                      </Table.Td>

                      {/* Status */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
                            u.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                              : "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800"
                          )}
                        >
                          <span className={clsx("h-1.5 w-1.5 rounded-full", u.status === "Active" ? "bg-emerald-500" : "bg-rose-500")} />
                          {u.status}
                        </span>
                      </Table.Td>

                      {/* Updated */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}>{u.updatedAt}</Table.Td>

                      {/* Actions: 3-dots menu */}
                      <Table.Td className={clsx("px-5", cellY, "text-center")}> 
                        <Menu>
                          <Menu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                            <Lucide icon="MoreVertical" className="w-4 h-4" />
                          </Menu.Button>
                          <Menu.Items className="w-44">
                            <Menu.Item onClick={() => onEdit(u)} className="text-[12px]">
                              <Lucide icon="PencilLine" className="w-3.5 h-3.5 mr-2" /> Edit
                            </Menu.Item>
                            <Menu.Item onClick={() => onDeactivate(u)} className="text-[12px] text-danger">
                              <Lucide icon="PauseCircle" className="w-3.5 h-3.5 mr-2" /> Deactivate
                            </Menu.Item>
                            <Menu.Item onClick={() => onResetPassword(u)} className="text-[12px]">
                              <Lucide icon="KeyRound" className="w-3.5 h-3.5 mr-2" /> Reset Password
                            </Menu.Item>
                            <Menu.Item onClick={() => onAssignRole(u)} className="text-[12px]">
                              <Lucide icon="UserCog" className="w-3.5 h-3.5 mr-2" /> Assign Role
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}

                {paged.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={10} className="text-center py-10 text-slate-500">
                      No users found for selected filters.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* Subtle row separators & hover effect */}
          <style>{`
            tbody tr { border-bottom: 1px dashed rgba(148,163,184,0.25); }
            tbody tr:hover { background: rgba(241,245,249,0.6); }
            .dark tbody tr:hover { background: rgba(30,41,59,0.45); }
            .btn-ghost { display:inline-flex; align-items:center; padding:6px 10px; border-radius:10px; }
            .btn-ghost:hover { background: rgba(148,163,184,0.18); }
            .dark .btn-ghost:hover { background: rgba(100,116,139,0.18); }
          `}</style>

          {/* Footer: Results & Pagination */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="text-slate-500 text-sm mr-auto">
              Showing <span className="font-medium">{paged.length}</span> of {filtered.length}
            </div>
            <Pagination className="w-full sm:w-auto">
              <Pagination.Link onClick={() => setPage(1)}>
                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link onClick={() => setPage(Math.max(1, pageSafe - 1))}>
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link active>{pageSafe}</Pagination.Link>
              <Pagination.Link onClick={() => setPage(Math.min(totalPages, pageSafe + 1))}>
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link onClick={() => setPage(totalPages)}>
                <Lucide icon="ChevronsRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>
            <FormSelect className="w-28 !box" value={density} onChange={(e) => setDensity(e.target.value as any)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </FormSelect>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationUsersPage;
