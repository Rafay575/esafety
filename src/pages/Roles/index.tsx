import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu as HeadlessMenu } from "@/components/Base/Headless";
import { useNavigate, useLocation } from "react-router-dom";
import menu, { type Menu as MenuType } from "@/stores/menuSlice";
import clsx from "clsx";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export" | "assign";

type PermissionResource = {
  id: string; // slug id
  module: string; // top-level module (e.g., E-Safety (PTW))
  label: string; // row label (e.g., LS – PJRA + PTW / Create PJRA + PTW)
  path?: string; // optional pathname for reference
};

export type Role = {
  id: string;
  name: string;
  description?: string;
  scope: "Org" | "Division" | "Subdivision";
  permissions: Record<string, PermissionAction[]>; // key: resourceId -> actions
  usersCount?: number;
};

// ──────────────────────────────────────────────────────────────────────────────
// Constants / Helpers
// ──────────────────────────────────────────────────────────────────────────────
const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "assign"];

const genRoleId = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `ROL-${y}${m}${day}-${rand}`;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Flatten the provided menu into a list of permission resources (modules & submodules)
function buildResources(m: Array<MenuType | "divider">): PermissionResource[] {
  const rows: PermissionResource[] = [];

  const pushLeaf = (modTitle: string, label: string, path?: string) => {
    const id = slugify(`${modTitle} ${label}`);
    rows.push({ id, module: modTitle, label, path });
  };

  for (const item of m) {
    if (item === "divider") continue;
    const modTitle = item.title;

    if (item.subMenu && item.subMenu.length) {
      for (const sub of item.subMenu) {
        if ((sub as MenuType).subMenu && (sub as MenuType).subMenu!.length) {
          // 3rd level leaves
          for (const leaf of (sub as MenuType).subMenu!) {
            pushLeaf(modTitle, `${sub.title} / ${leaf.title}`, leaf.pathname);
          }
        } else {
          // 2nd level leaf
          pushLeaf(modTitle, sub.title, sub.pathname);
        }
      }
    } else {
      // Top-level leaf with direct pathname
      pushLeaf(modTitle, item.title, item.pathname);
    }
  }

  return rows;
}

// Group resources by module for table sections
function groupByModule(resources: PermissionResource[]): Record<string, PermissionResource[]> {
  return resources.reduce((acc, r) => {
    acc[r.module] = acc[r.module] || [];
    acc[r.module].push(r);
    return acc;
  }, {} as Record<string, PermissionResource[]>);
}

// ──────────────────────────────────────────────────────────────────────────────
// Mock Data (replace with API)
// ──────────────────────────────────────────────────────────────────────────────
const MOCK_ROLES: Role[] = [
  {
    id: "ROL-20250918-311",
    name: "Administrator",
    description: "Full system access",
    scope: "Org",
    usersCount: 8,
    permissions: {},
  },
  {
    id: "ROL-20250917-227",
    name: "SDO Reviewer",
    description: "SDO can review and route PTWs",
    scope: "Division",
    usersCount: 21,
    permissions: {},
  },
  {
    id: "ROL-20250916-143",
    name: "Line Staff",
    description: "Crew execution permissions",
    scope: "Subdivision",
    usersCount: 64,
    permissions: {},
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Pages
// ──────────────────────────────────────────────────────────────────────────────

// 1) Roles List Page
const RolesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [assigned, setAssigned] = useState("all"); // all | yes | no

  const filtered = useMemo(() => {
    let rows = [...MOCK_ROLES];
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter((r) => r.id.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
    }
    if (scope !== "all") rows = rows.filter((r) => r.scope === (scope as Role["scope"]));
    if (assigned !== "all") {
      rows = rows.filter((r) => (assigned === "yes" ? (r.usersCount || 0) > 0 : (r.usersCount || 0) === 0));
    }
    return rows;
  }, [q, scope, assigned]);

  // simple pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <h2 className="text-lg font-medium">Roles & Permissions</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="primary" onClick={() => navigate("/roles/add")}> 
            <Lucide icon="Plus" className="w-4 h-4 mr-2" /> Add Role
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 intro-y">
        <div className="box p-5 rounded-2xl border border-slate-200/60 dark:border-darkmode-300">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4">
              <div className="relative text-slate-500">
                <Lucide icon="Search" className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4" />
                <FormInput className="pl-9" placeholder="Search role by name or ID" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
              </div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect value={scope} onChange={(e) => { setPage(1); setScope(e.target.value); }}>
                <option value="all">All Scopes</option>
                <option value="Org">Org</option>
                <option value="Division">Division</option>
                <option value="Subdivision">Subdivision</option>
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <FormSelect value={assigned} onChange={(e) => { setPage(1); setAssigned(e.target.value); }}>
                <option value="all">All Roles</option>
                <option value="yes">With Users</option>
                <option value="no">No Users</option>
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-2">
              <Button variant="outline-secondary" className="w-full" onClick={() => { setQ(""); setScope("all"); setAssigned("all"); setPage(1); }}>Reset</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-span-12 intro-y">
        <div className="box p-0 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-darkmode-300">
          <div className="overflow-auto">
            <Table className="w-full table-auto">
              <Table.Thead>
                <Table.Tr>
                  {["SR", "Role ID", "Role Name", "Scope", "# Users", "Actions"].map((h, i) => (
                    <Table.Th key={h} className={clsx("sticky top-0 z-10 bg-white/80 dark:bg-darkmode-700/80 backdrop-blur text-left text-[11px] font-semibold uppercase tracking-wide px-5 py-3 border-b", i === 0 && "w-14 text-center", h === "Actions" && "text-center")}>{h}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paged.map((r, i) => {
                  const sr = (pageSafe - 1) * pageSize + i + 1;
                  return (
                    <Table.Tr key={r.id} className="group transition-all">
                      <Table.Td className="px-5 py-3 text-center text-slate-500">{sr}</Table.Td>
                      <Table.Td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{r.id}</Table.Td>
                      <Table.Td className="px-5 py-3">
                        <div className="font-medium">{r.name}</div>
                        {r.description && <div className="text-xs text-slate-500">{r.description}</div>}
                      </Table.Td>
                      <Table.Td className="px-5 py-3">{r.scope}</Table.Td>
                      <Table.Td className="px-5 py-3">{r.usersCount ?? 0}</Table.Td>
                      <Table.Td className="px-5 py-3 text-center">
                        <HeadlessMenu>
                          <HeadlessMenu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                            <Lucide icon="MoreVertical" className="w-4 h-4" />
                          </HeadlessMenu.Button>
                          <HeadlessMenu.Items className="w-44">
                            <HeadlessMenu.Item className="text-[12px]" onClick={() => navigate(`/admin/roles/${r.id}`)}>
                              <Lucide icon="PencilLine" className="w-3.5 h-3.5 mr-2" /> Edit Role
                            </HeadlessMenu.Item>
                            <HeadlessMenu.Item className="text-[12px]" onClick={() => navigate(`/admin/roles/${r.id}/permissions`)}>
                              <Lucide icon="ShieldCheck" className="w-3.5 h-3.5 mr-2" /> Assign Permissions
                            </HeadlessMenu.Item>
                            <HeadlessMenu.Item className="text-[12px] text-danger" onClick={() => console.log("Delete", r.id)}>
                              <Lucide icon="Trash2" className="w-3.5 h-3.5 mr-2" /> Delete
                            </HeadlessMenu.Item>
                          </HeadlessMenu.Items>
                        </HeadlessMenu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {paged.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="text-center py-10 text-slate-500">No roles found.</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          <div className="flex items-center gap-3 px-5 py-4">
            <div className="text-slate-500 text-sm mr-auto">Showing <span className="font-medium">{paged.length}</span> of {filtered.length}</div>
            <Pagination className="w-full sm:w-auto">
              <Pagination.Link onClick={() => setPage(1)}><Lucide icon="ChevronsLeft" className="w-4 h-4" /></Pagination.Link>
              <Pagination.Link onClick={() => setPage(Math.max(1, pageSafe - 1))}><Lucide icon="ChevronLeft" className="w-4 h-4" /></Pagination.Link>
              <Pagination.Link active>{pageSafe}</Pagination.Link>
              <Pagination.Link onClick={() => setPage(Math.min(totalPages, pageSafe + 1))}><Lucide icon="ChevronRight" className="w-4 h-4" /></Pagination.Link>
              <Pagination.Link onClick={() => setPage(totalPages)}><Lucide icon="ChevronsRight" className="w-4 h-4" /></Pagination.Link>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2) Role Form + Permissions Matrix


// Default export: list page (use RoleFormPage for add/edit)
export default RolesListPage;
