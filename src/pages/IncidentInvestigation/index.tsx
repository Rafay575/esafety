import React, { useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import { Dialog, Menu } from "@/components/Base/Headless";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import { useNavigate, useSearchParams } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */
type CAPAPriority = "Low" | "Medium" | "High";
type CAPAStatus = "Open" | "In Progress" | "Resolved" | "Closed";

type CAPAAction = {
  id: number;
  title: string;
  owner: string;
  dueDate: string; // yyyy-mm-dd
  priority: CAPAPriority;
  status: CAPAStatus;
  notes?: string;
  evidenceFiles?: FileList | null;
};

/* -------------------------------------------------------------------------- */
/* Options                                                                     */
/* -------------------------------------------------------------------------- */
const PRIORITIES: CAPAPriority[] = ["Low", "Medium", "High"];
const STATUSES: CAPAStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
const IncidentInvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const incidentRef = params.get("id") || ""; // pass ?id=INC-123 to prefill

  // Investigation form state
  const [rootCauses, setRootCauses] = useState<string[]>([""]); // dynamic rows
  const [fiveWhy, setFiveWhy] = useState<string[]>(["", "", "", "", ""]); // 5-Why inputs
  const [investigationEvidence, setInvestigationEvidence] = useState<FileList | null>(null);

  // CAPA actions
  const [capa, setCapa] = useState<CAPAAction[]>([]);
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");

  // Add/Edit CAPA modal
  const [capaOpen, setCapaOpen] = useState(false);
  const [editing, setEditing] = useState<CAPAAction | null>(null);
  const [capaForm, setCapaForm] = useState<Omit<CAPAAction, "id">>({
    title: "",
    owner: "",
    dueDate: "",
    priority: "Medium",
    status: "Open",
    notes: "",
    evidenceFiles: null,
  });

  // Assign confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* --------------------------------- Helpers -------------------------------- */
  const cellY = density === "compact" ? "py-2" : "py-3";

  const addCause = () => setRootCauses((prev) => [...prev, ""]);
  const removeCause = (idx: number) =>
    setRootCauses((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updateCause = (idx: number, val: string) =>
    setRootCauses((prev) => prev.map((v, i) => (i === idx ? val : v)));

  const onOpenAddCapa = () => {
    setEditing(null);
    setCapaForm({
      title: "",
      owner: "",
      dueDate: "",
      priority: "Medium",
      status: "Open",
      notes: "",
      evidenceFiles: null,
    });
    setCapaOpen(true);
  };

  const onOpenEditCapa = (row: CAPAAction) => {
    setEditing(row);
    setCapaForm({
      title: row.title,
      owner: row.owner,
      dueDate: row.dueDate,
      priority: row.priority,
      status: row.status,
      notes: row.notes || "",
      evidenceFiles: null, // keep files separate (new uploads only)
    });
    setCapaOpen(true);
  };

  const saveCapa = () => {
    if (!capaForm.title.trim() || !capaForm.owner.trim() || !capaForm.dueDate) {
      alert("Title, Owner, and Due Date are required for CAPA.");
      return;
    }
    if (editing) {
      setCapa((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? { ...x, ...capaForm }
            : x
        )
      );
    } else {
      const newId = Math.max(0, ...capa.map((c) => c.id)) + 1;
      setCapa((prev) => [{ id: newId, ...capaForm }, ...prev]);
    }
    setCapaOpen(false);
  };

  const removeCapa = (row: CAPAAction) => {
    setCapa((prev) => prev.filter((x) => x.id !== row.id));
  };

  /* ------------------------------- Validation ------------------------------- */
  const errors = useMemo(() => {
    const e: { rootCauses?: string; capa?: string } = {};
    const hasAtLeastOneCause = rootCauses.some((c) => c.trim().length > 0);
    if (!hasAtLeastOneCause) e.rootCauses = "Provide at least one root cause.";
    if (capa.length === 0) e.capa = "Add at least one CAPA action to assign.";
    return e;
  }, [rootCauses, capa]);

  const doAssign = async () => {
    if (Object.keys(errors).length) {
      alert("Please fix the errors before assigning CAPA.");
      return;
    }

    try {
      setSubmitting(true);

      // Build payload (multipart for investigation evidence & CAPA evidence)
      const fd = new FormData();
      if (incidentRef) fd.append("incident_id", incidentRef);

      rootCauses.forEach((c, i) => {
        if (c.trim()) fd.append(`root_causes[${i}]`, c.trim());
      });
      fiveWhy.forEach((w, i) => {
        if (w.trim()) fd.append(`five_why[${i}]`, w.trim());
      });
      if (investigationEvidence && investigationEvidence.length) {
        Array.from(investigationEvidence).forEach((file) =>
          fd.append("investigation_evidence[]", file)
        );
      }

      capa.forEach((c, i) => {
        fd.append(`capa[${i}][title]`, c.title);
        fd.append(`capa[${i}][owner]`, c.owner);
        fd.append(`capa[${i}][due_date]`, c.dueDate);
        fd.append(`capa[${i}][priority]`, c.priority);
        fd.append(`capa[${i}][status]`, c.status);
        if (c.notes) fd.append(`capa[${i}][notes]`, c.notes);
        // if you let users attach per-row evidence at creation/edit time:
        // (This demo keeps uploads transient; wire from modal if you want)
      });

      // TODO: POST fd to your backend endpoint
      // await fetch("/api/incidents/investigation", { method: "POST", body: fd });

      // demo
      setTimeout(() => {
        alert("CAPA assigned successfully.");
        navigate("/incidents"); // or go back
      }, 350);
    } catch (err) {
      console.error(err);
      alert("Failed to assign CAPA. Try again.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  /* ---------------------------------- UI ----------------------------------- */
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12 flex items-center h-10 intro-y mt-4">
        <h2 className="mr-5 text-lg font-medium truncate">
          Investigation & CAPA {incidentRef ? `— ${incidentRef}` : ""}
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <FormSelect
            className="!w-36"
            value={density}
            onChange={(e) => (setDensity(e.target.value as any))}
            title="Row density"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </FormSelect>

          <Button variant="primary" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            <Lucide icon="Send" className="w-4 h-4 mr-2" />
            Assign CAPA
          </Button>
        </div>
      </div>

      {/* Investigation Card */}
      <div className="col-span-12 lg:col-span-7 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          {/* Root Causes */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Root Causes</div>
            <Button variant="secondary" onClick={addCause}>
              <Lucide icon="Plus" className="w-4 h-4 mr-2" />
              Add Cause
            </Button>
          </div>
          <div className="space-y-3">
            {rootCauses.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <FormInput
                  value={c}
                  onChange={(e) => updateCause(idx, e.target.value)}
                  placeholder={`Root cause #${idx + 1}`}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => removeCause(idx)}
                  disabled={rootCauses.length === 1}
                >
                  <Lucide icon="Trash2" className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {errors.rootCauses && (
              <div className="text-rose-600 text-xs mt-1">{errors.rootCauses}</div>
            )}
          </div>

          {/* 5-Why */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">5-Why Analysis</div>
            <div className="space-y-3">
              {fiveWhy.map((w, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-2 flex items-center">
                    <span className="text-xs text-slate-500">Why {idx + 1}</span>
                  </div>
                  <div className="col-span-12 sm:col-span-10">
                    <FormInput
                      value={w}
                      onChange={(e) =>
                        setFiveWhy((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                      }
                      placeholder="Explain the reason…"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Investigation Evidence</div>
            <FormInput
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInvestigationEvidence(e.target.files || null)
              }
            />
            <div className="text-xs text-slate-500 mt-1">
              Add images/PDFs that support your investigation.
            </div>
          </div>
        </div>
      </div>

      {/* CAPA Card */}
      <div className="col-span-12 lg:col-span-5 intro-y">
        <div className="box p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-darkmode-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">CAPA Actions</div>
            <Button variant="secondary" onClick={onOpenAddCapa}>
              <Lucide icon="PlusCircle" className="w-4 h-4 mr-2" />
              Add CAPA
            </Button>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-200/70 dark:border-darkmode-300">
            <Table className="table-auto w-full">
              <Table.Thead>
                <Table.Tr>
                  {["Title", "Owner", "Due", "Priority", "Status", "Actions"].map((h) => (
                    <Table.Th
                      key={h}
                      className="sticky top-0 z-10 bg-white/80 dark:bg-darkmode-700/80 backdrop-blur text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide px-4 py-2.5 border-b border-slate-200/70 dark:border-darkmode-400"
                    >
                      {h}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {capa.map((row) => (
                  <Table.Tr key={row.id} className={clsx("group", density === "compact" ? "text-[13px]" : "text-sm")}>
                    <Table.Td className={clsx("px-4", cellY)}>
                      <div className="font-medium">{row.title}</div>
                      {row.notes && <div className="text-xs text-slate-500 truncate max-w-[280px]">{row.notes}</div>}
                    </Table.Td>
                    <Table.Td className={clsx("px-4", cellY)}>{row.owner}</Table.Td>
                    <Table.Td className={clsx("px-4", cellY)}>{row.dueDate}</Table.Td>
                    <Table.Td className={clsx("px-4", cellY)}>
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset",
                          row.priority === "High" && "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800",
                          row.priority === "Medium" && "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
                          row.priority === "Low" && "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800"
                        )}
                      >
                        {row.priority}
                      </span>
                    </Table.Td>
                    <Table.Td className={clsx("px-4", cellY)}>{row.status}</Table.Td>
                    <Table.Td className={clsx("px-4", cellY)}>
                      <Menu>
                        <Menu.Button as={Button} variant="outline-secondary" className="!px-2 !py-1 rounded-xl">
                          <Lucide icon="MoreVertical" className="w-4 h-4" />
                        </Menu.Button>
                        <Menu.Items className="w-40">
                          <Menu.Item onClick={() => onOpenEditCapa(row)} className="text-[12px]">
                            <Lucide icon="PencilLine" className="w-3.5 h-3.5 mr-2" /> Edit
                          </Menu.Item>
                          <Menu.Item onClick={() => removeCapa(row)} className="text-[12px] text-danger">
                            <Lucide icon="Trash2" className="w-3.5 h-3.5 mr-2" /> Remove
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {capa.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="text-center py-8 text-slate-500">
                      No CAPA actions added yet.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>
          {errors.capa && <div className="text-rose-600 text-xs mt-2">{errors.capa}</div>}
        </div>
      </div>

      {/* Add/Edit CAPA Modal */}
      <Dialog open={capaOpen} onClose={setCapaOpen}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium">{editing ? "Edit CAPA Action" : "Add CAPA Action"}</div>

            <div className="mt-4 grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <label className="form-label required">Title</label>
                <FormInput
                  value={capaForm.title}
                  onChange={(e) => setCapaForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Replace damaged gloves with certified PPE"
                />
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label className="form-label required">Owner</label>
                <FormInput
                  value={capaForm.owner}
                  onChange={(e) => setCapaForm((f) => ({ ...f, owner: e.target.value }))}
                  placeholder="Assignee name"
                />
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label className="form-label required">Due Date</label>
                <FormInput
                  type="date"
                  value={capaForm.dueDate}
                  onChange={(e) => setCapaForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label className="form-label">Priority</label>
                <FormSelect
                  value={capaForm.priority}
                  onChange={(e) => setCapaForm((f) => ({ ...f, priority: e.target.value as CAPAPriority }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label className="form-label">Status</label>
                <FormSelect
                  value={capaForm.status}
                  onChange={(e) => setCapaForm((f) => ({ ...f, status: e.target.value as CAPAStatus }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="col-span-12">
                <label className="form-label">Notes (optional)</label>
                <FormTextarea
                  rows={4}
                  value={capaForm.notes}
                  onChange={(e) => setCapaForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional details for this action"
                />
              </div>

              <div className="col-span-12">
                <label className="form-label">Evidence (optional)</label>
                <FormInput
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCapaForm((f) => ({ ...f, evidenceFiles: e.target.files || null }))
                  }
                />
                <div className="text-xs text-slate-500 mt-1">
                  Attach related proof for this CAPA (images/PDF).
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline-secondary" onClick={() => setCapaOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveCapa}>
                {editing ? "Save Changes" : "Add CAPA"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Assign Confirmation */}
      <Dialog open={confirmOpen} onClose={setConfirmOpen}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-base font-medium">Assign CAPA?</div>
            <div className="mt-2 text-xs text-slate-500">
              This will assign all CAPA actions to their respective owners and save your investigation.
            </div>

            {(errors.rootCauses || errors.capa) && (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700 text-xs">
                <div className="font-medium mb-1">Please fix:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {errors.rootCauses && <li>{errors.rootCauses}</li>}
                  {errors.capa && <li>{errors.capa}</li>}
                </ul>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline-secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={doAssign} disabled={submitting}>
                {submitting ? "Assigning…" : "Confirm & Assign"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default IncidentInvestigationPage;
