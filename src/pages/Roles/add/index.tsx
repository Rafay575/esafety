import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu as HeadlessMenu } from "@/components/Base/Headless";
import { useNavigate, useLocation } from "react-router-dom";

// IMPORTANT: Import the MENU **DATA ARRAY** (not the slice reducer)
// Adjust the path below to where you exported `export default menu` for your modules
import menu  from "@/main/side-menu"; // e.g., '@/stores/menu' that contains `export default menu`

// If you still want a type, you can declare a light-weight local shape for safety
export type MenuNode = {
  icon?: string;
  title: string;
  pathname?: string;
  subMenu?: MenuNode[];
} | "divider";

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
function buildResources(m: MenuNode[]): PermissionResource[] {
  const rows: PermissionResource[] = [];

  const pushLeaf = (modTitle: string, label: string, path?: string) => {
    const id = slugify(`${modTitle} ${label}`);
    rows.push({ id, module: modTitle, label, path });
  };

  const walk = (node: MenuNode, parentModule?: string, parentLabel?: string) => {
    if (node === "divider") return;
    const isTop = !parentModule;
    const moduleTitle = isTop ? node.title : parentModule!;

    if (node.subMenu && node.subMenu.length) {
      // node is a group; walk children
      for (const child of node.subMenu) {
        walk(child, moduleTitle, node.title);
      }
    } else {
      // leaf: has optional pathname
      const label = parentLabel && parentLabel !== moduleTitle ? `${parentLabel} / ${node.title}` : node.title;
      pushLeaf(moduleTitle, label, node.pathname);
    }
  };

  for (const item of m) walk(item);
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
// Mock Roles (replace with API)
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
// 2) Role Form + Permissions Matrix
// ──────────────────────────────────────────────────────────────────────────────
export const RoleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // data sources
  const resources = useMemo(() => buildResources(menu as MenuNode[]), []);
  const grouped = useMemo(() => groupByModule(resources), [resources]);

  // role state
  const [roleId] = useState(genRoleId());
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<Role["scope"]>("Org");

  // permissions map: resourceId -> Set(actions)
  const [perms, setPerms] = useState<Record<string, Set<PermissionAction>>>(() => ({}));

  // helpers
  const has = (resId: string, action: PermissionAction) => perms[resId]?.has(action) ?? false;
  const toggle = (resId: string, action: PermissionAction) => {
    setPerms((prev) => {
      const cur = new Set(prev[resId] ?? []);
      if (cur.has(action)) cur.delete(action); else cur.add(action);
      return { ...prev, [resId]: cur };
    });
  };

  const setRowAll = (resId: string, checked: boolean) => {
    setPerms((prev) => ({ ...prev, [resId]: checked ? new Set(ACTIONS) : new Set() }));
  };

  const setModuleAll = (module: string, checked: boolean) => {
    setPerms((prev) => {
      const copy: Record<string, Set<PermissionAction>> = { ...prev };
      for (const r of grouped[module] || []) {
        copy[r.id] = checked ? new Set(ACTIONS) : new Set();
      }
      return copy;
    });
  };

  const setColumnAll = (action: PermissionAction, checked: boolean) => {
    setPerms((prev) => {
      const copy: Record<string, Set<PermissionAction>> = { ...prev };
      for (const r of resources) {
        const cur = new Set(copy[r.id] ?? []);
        if (checked) cur.add(action); else cur.delete(action);
        copy[r.id] = cur;
      }
      return copy;
    });
  };

  // derived helpers for header checkboxes
  const columnAllChecked = (action: PermissionAction) => resources.every((r) => has(r.id, action));
  const columnSomeChecked = (action: PermissionAction) => resources.some((r) => has(r.id, action));

  const moduleAllChecked = (module: string) => (grouped[module] || []).every((r) => ACTIONS.every((a) => has(r.id, a)));
  const moduleSomeChecked = (module: string) => (grouped[module] || []).some((r) => (perms[r.id]?.size ?? 0) > 0);

  const rowAllChecked = (resId: string) => ACTIONS.every((a) => has(resId, a));
  const rowSomeChecked = (resId: string) => (perms[resId]?.size ?? 0) > 0 && !rowAllChecked(resId);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return alert("Role Name is required");
    const out: Role = {
      id: roleId,
      name: roleName.trim(),
      description: description.trim() || undefined,
      scope,
      usersCount: 0,
      permissions: Object.fromEntries(
        Object.entries(perms).map(([resId, set]) => [resId, Array.from(set)])
      ),
    };
    console.log("SAVE ROLE", out);
    // TODO: POST to API, then redirect
    navigate("/admin/roles");
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-2">
        <div className="flex items-center gap-2">
          <Button variant="outline-secondary" className="!px-3" onClick={() => navigate(-1)}>
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-medium">{location.pathname.includes("/new") ? "Add Role" : "Edit Role"}</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>Reset</Button>
          <Button variant="primary" onClick={onSubmit}>
            <Lucide icon="Save" className="w-4 h-4 mr-2" /> Save Role
          </Button>
        </div>
      </div>

      {/* Role Meta */}
      <form className="col-span-12 box p-6 rounded-2xl border border-slate-200/60 dark:border-darkmode-300" onSubmit={onSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <label className="col-span-12 md:col-span-3">
            <span className="text-xs text-slate-500">Role ID (auto)</span>
            <FormInput value={roleId} disabled readOnly />
          </label>
          <label className="col-span-12 md:col-span-4">
            <span className="text-xs text-slate-500">Role Name *</span>
            <FormInput value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g., SDO Reviewer" />
          </label>
          <label className="col-span-12 md:col-span-3">
            <span className="text-xs text-slate-500">Scope *</span>
            <FormSelect value={scope} onChange={(e) => setScope(e.target.value as Role["scope"]) }>
              <option value="Org">Org</option>
              <option value="Division">Division</option>
              <option value="Subdivision">Subdivision</option>
            </FormSelect>
          </label>
          <label className="col-span-12">
            <span className="text-xs text-slate-500">Description (optional)</span>
            <textarea className="w-full !box rounded-md p-3 min-h-[84px] text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What can this role do?" />
          </label>
        </div>

        {/* Permissions Matrix */}
        <div className="mt-6">
          <div className="flex items-center mb-3">
            <h3 className="text-base font-semibold">Permissions</h3>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="hidden sm:inline">Quick Toggle Columns:</span>
              {ACTIONS.map((a) => (
                <label key={a} className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={columnAllChecked(a)}
                    ref={(el) => { if (el) el.indeterminate = !columnAllChecked(a) && columnSomeChecked(a); }}
                    onChange={(e) => setColumnAll(a, e.target.checked)}
                  />
                  <span className="capitalize">{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border border-slate-200/60 dark:border-darkmode-300">
            <Table className="w-full table-fixed min-w-[860px]">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="w-[28%] px-4 py-3 text-left sticky top-0 bg-white/80 dark:bg-darkmode-700/80 backdrop-blur">Module / Submodule</Table.Th>
                  <Table.Th className="w-[8%] px-2 py-3 sticky top-0 bg-white/80 dark:bg-darkmode-700/80 text-center">All</Table.Th>
                  {ACTIONS.map((a) => (
                    <Table.Th key={a} className="w-[9%] px-2 py-3 sticky top-0 bg-white/80 dark:bg-darkmode-700/80 text-center capitalize">{a}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {Object.entries(grouped).map(([module, rows]) => (
                  <React.Fragment key={module}>
                    {/* Module header row with Select All for module */}
                    <Table.Tr>
                      <Table.Td colSpan={ACTIONS.length + 2} className="bg-slate-50/70 dark:bg-darkmode-600/60 px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{module}</span>
                          <label className="ml-auto inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={moduleAllChecked(module)}
                              ref={(el) => { if (el) el.indeterminate = !moduleAllChecked(module) && moduleSomeChecked(module); }}
                              onChange={(e) => setModuleAll(module, e.target.checked)}
                            />
                            <span>Select all in module</span>
                          </label>
                        </div>
                      </Table.Td>
                    </Table.Tr>

                    {/* Submodule/leaf rows */}
                    {rows.map((r) => (
                      <Table.Tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-darkmode-600/40">
                        <Table.Td className="px-4 py-2 text-sm">
                          <div className="font-medium text-slate-800 dark:text-slate-100">{r.label}</div>
                          {r.path && (
                            <div className="text-xs text-slate-500 truncate">
                              <Tippy content={r.path}><span>{r.path}</span></Tippy>
                            </div>
                          )}
                        </Table.Td>
                        {/* Row all */}
                        <Table.Td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={rowAllChecked(r.id)}
                            ref={(el) => { if (el) el.indeterminate = rowSomeChecked(r.id); }}
                            onChange={(e) => setRowAll(r.id, e.target.checked)}
                          />
                        </Table.Td>
                        {ACTIONS.map((a) => (
                          <Table.Td key={`${r.id}-${a}`} className="px-2 py-2 text-center">
                            <input type="checkbox" checked={has(r.id, a)} onChange={() => toggle(r.id, a)} />
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </React.Fragment>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="outline-secondary" type="button" onClick={() => navigate(-1)}>
            <Lucide icon="X" className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button variant="primary" type="submit">
            <Lucide icon="CheckCircle2" className="w-4 h-4 mr-2" /> Save Role
          </Button>
        </div>
      </form>
    </div>
  );
};

// Default export: list page (use RoleFormPage for add/edit)
export default RoleFormPage;
