"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Printer,
  ArrowLeft,
  Send,
  Clock,
  Upload,
  Pencil,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import Button from "@/components/Base/Button";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";

// ---------- TYPES ----------
export type PtwStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "SDO_RETURNED"
  | "SDO_CANCELLED"
  | "SDO_FORWARDED_TO_XEN"
  | "XEN_RETURNED_TO_SDO"
  | "XEN_REJECTED"
  | "XEN_APPROVED_TO_PDC"
  | "PDC_DELEGATED_TO_GRID"
  | "GRID_PRECHECKS_DONE"
  | "PTW_ISSUED"
  | "IN_EXECUTION"
  | "COMPLETION_SUBMITTED"
  | "GRID_RESTORED_AND_CLOSED"
  | "CANCELLATION_REQUESTED_BY_LS"
  | "GRID_CANCELLATION_CONFIRMED_AND_CLOSED"
  | "LS_RESUBMIT_TO_XEN"
  | "XEN_RETURNED_TO_LS"
  | "PDC_RETURNED_TO_LS"
  | "LS_RESUBMIT_TO_PDC"
  | "PDC_REJECTED"
  | "CANCELLATION_APPROVED_BY_SDO"
  | "PDC_CONFIRMED"
  | "PENDING_PDC_CONFIRMATION"
  | "GRID_RESOLVE_REQUIRED"
  | "RE_SUBMITTED_TO_PDC"
  | "NO_PTW_APPROVED_BY_SDO";

type ChecklistItem = {
  id: number;
  label_en: string;
  label_ur: string;
  value: "YES" | "NO" | null;
};

type LogItem = {
  id: number;
  action: string;
  role: string;
  notes: string;
  meta_json: string;
  created_at: string;
  actor_name: string;
};

type Feeder = {
  id: number;
  name: string;
  code: string;
  is_on: boolean;
  type?: "primary" | "secondary";
};

type PrimaryFeeders = {
  [gridId: string]: {
    grid_id: number;
    grid_code: string;
    feeders: {
      primary: Feeder[];
      secondary: Feeder[];
    };
    operators: any[];
  };
};

type PdcUser = {
  id: number;
  name: string;
  sap_code: string;
  is_current_user: boolean;
  active_ptw_count: number;
  logged_in_at: string;
  last_activity_at: string;
  device_name: string;
  device_model: string;
};

type PTWPreviewData = {
  ptw: {
    id: number;
    ptw_code: string;
    work_order_no: string;
    type: string;
    misc_type: string | null;
    scope_of_work: string | null;
    current_status: PtwStatus;
    place_of_work: string | null;
    scheduled_start_at: string | null;
    estimated_duration_min: number | null;
    feeder_incharge_name: string | null;
    sub_division_name: string | null;
    location: string | null;
    close_feeder: string | null;
    alternate_feeder: string | null;
    switch_off_time: string | null;
    restore_time: string | null;
    safety_arrangements: string | null;
    feeder_name: string | null;
    transformer_name: string | null;
    evidences: { id: number; file_path: string; type: string }[];
    team_members: { id: number; name: string; avatar_url: string }[];
    logs?: LogItem[];
    is_ptw_required?: boolean;
    primary_feeders?: PrimaryFeeders;
    location_lat?: number | string;
    location_lng?: number | string;
  };
  checklists: {
    LINE_TYPE: ChecklistItem[];
    HAZARDS: ChecklistItem[];
    PRECAUTION: ChecklistItem[];
  };
  active_pdc_users?: PdcUser[];
};

// ---------- ROLES CONSTANT ----------
export const ROLES = {
  LS: "LS",
  SDO: "SDO",
  XEN: "XEN",
  PDC: "PDC",
  GRID: "GRID",
} as const;

// ---------- ACTION TYPE ----------
type PtwAction = {
  label: string;
  endpoint: string;
  role: (typeof ROLES)[keyof typeof ROLES];
  successMessage: string;
  variant?: "primary" | "danger" | "outline-secondary";
  condition?: (ptw: PTWPreviewData["ptw"]) => boolean;
  requiresChecklist?: boolean;
  checklistType?: string;
  requiresExtraFields?: boolean;
  extraFields?: { name: string; label: string; placeholder?: string; required?: boolean }[];
  requiresExecutionStart?: boolean;
  requiresCompletionSubmit?: boolean;
  requiresGridRestoreClose?: boolean;
};

// ---------- STATUS CONFIG ----------
const PTW_STATUS_CONFIG: Record<PtwStatus, {
  label: string;
  badgeClass: string;
  actions: PtwAction[];
}> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-amber-100 text-amber-800",
    actions: [
      { label: "Submit to SDO", endpoint: "/submit-to-sdo", role: ROLES.LS, successMessage: "PTW submitted to SDO", variant: "primary" },
      { label: "Cancel Draft", endpoint: "/cancel-draft", role: ROLES.LS, successMessage: "Draft cancelled", variant: "danger" },
    ],
  },
  SUBMITTED: {
    label: "Submitted",
    badgeClass: "bg-blue-100 text-blue-800",
    actions: [
      { label: "Return to LS", endpoint: "/return", role: ROLES.SDO, successMessage: "Returned to LS", variant: "outline-secondary", condition: (ptw) => ptw.is_ptw_required !== false },
      { label: "Cancel PTW", endpoint: "/cancel", role: ROLES.SDO, successMessage: "PTW cancelled", variant: "danger", condition: (ptw) => ptw.is_ptw_required !== false },
      { label: "Forward to XEN", endpoint: "/forward-xen", role: ROLES.SDO, successMessage: "Forwarded to XEN", variant: "primary", condition: (ptw) => ptw.is_ptw_required !== false },
      { label: "Approve (No PTW Required)", endpoint: "/approve-no-ptw", role: ROLES.SDO, successMessage: "Approved without PTW", variant: "primary", condition: (ptw) => ptw.is_ptw_required === false },
    ],
  },
  SDO_RETURNED: { label: "SDO Returned", badgeClass: "bg-orange-100 text-orange-800", actions: [] },
  SDO_CANCELLED: { label: "SDO Cancelled", badgeClass: "bg-red-100 text-red-800", actions: [] },
  SDO_FORWARDED_TO_XEN: {
    label: "SDO Forwarded to XEN",
    badgeClass: "bg-blue-100 text-blue-800",
    actions: [
      { label: "Return to LS", endpoint: "/xen/return-ls", role: ROLES.XEN, successMessage: "Returned to LS", variant: "outline-secondary" },
      { label: "Reject PTW", endpoint: "/xen/reject", role: ROLES.XEN, successMessage: "Rejected by XEN", variant: "danger" },
      { label: "Forward to PDC", endpoint: "/xen/approve-pdc", role: ROLES.XEN, successMessage: "Forwarded to PDC", variant: "primary" },
    ],
  },
  XEN_RETURNED_TO_SDO: { label: "XEN Returned to SDO", badgeClass: "bg-orange-100 text-orange-800", actions: [] },
  XEN_REJECTED: { label: "XEN Rejected", badgeClass: "bg-red-100 text-red-800", actions: [] },
  XEN_APPROVED_TO_PDC: {
    label: "XEN Approved to PDC",
    badgeClass: "bg-teal-100 text-teal-800",
    actions: [
      { label: "Delegate to GRID", endpoint: "/delegate-grid", role: ROLES.PDC, successMessage: "Delegated to GRID", variant: "primary" },
      { label: "Return to LS", endpoint: "/pdc/return-ls", role: ROLES.PDC, successMessage: "Returned to LS", variant: "outline-secondary" },
      { label: "Reject PTW", endpoint: "/pdc/reject", role: ROLES.PDC, successMessage: "Rejected by PDC", variant: "danger" },
    ],
  },
  PDC_DELEGATED_TO_GRID: {
    label: "PDC Delegated to GRID",
    badgeClass: "bg-purple-100 text-purple-800",
    actions: [
      { label: "Issue PTW", endpoint: "/prechecks-done", role: ROLES.GRID, successMessage: "Prechecks done and PTW issued", variant: "primary", requiresChecklist: true, checklistType: "GRID_PTW_ISSUE" },
    ],
  },
  GRID_PRECHECKS_DONE: { label: "GRID Prechecks Done", badgeClass: "bg-indigo-100 text-indigo-800", actions: [] },
  PTW_ISSUED: { label: "PTW Issued", badgeClass: "bg-green-100 text-green-800", actions: [] },
  IN_EXECUTION: {
    label: "In Execution",
    badgeClass: "bg-cyan-100 text-cyan-800",
    actions: [
      { label: "Complete PTW", endpoint: "/completion-submit", role: ROLES.LS, successMessage: "PTW completion submitted successfully", variant: "primary", requiresCompletionSubmit: true },
    ],
  },
  COMPLETION_SUBMITTED: {
    label: "Completion Submitted",
    badgeClass: "bg-lime-100 text-lime-800",
    actions: [
      { label: "Restore & Close", endpoint: "/mark-restored-and-closed", role: ROLES.GRID, successMessage: "PTW restored and closed successfully", variant: "primary", requiresGridRestoreClose: true },
    ],
  },
  GRID_RESTORED_AND_CLOSED: { label: "Grid Restored and Closed", badgeClass: "bg-slate-200 text-slate-700", actions: [] },
  CANCELLATION_REQUESTED_BY_LS: {
    label: "Cancellation Requested by LS",
    badgeClass: "bg-yellow-100 text-yellow-800",
    actions: [
      { label: "Approve Cancellation", endpoint: "/approve-cancellation", role: ROLES.SDO, successMessage: "Cancellation approved by SDO", variant: "primary" },
    ],
  },
  GRID_CANCELLATION_CONFIRMED_AND_CLOSED: { label: "Grid Cancellation Confirmed & Closed", badgeClass: "bg-slate-200 text-slate-700", actions: [] },
  LS_RESUBMIT_TO_XEN: {
    label: "LS Resubmit to XEN",
    badgeClass: "bg-blue-100 text-blue-800",
    actions: [
      { label: "Return to LS", endpoint: "/xen/return-ls", role: ROLES.XEN, successMessage: "Returned to LS", variant: "outline-secondary" },
      { label: "Reject PTW", endpoint: "/xen/reject", role: ROLES.XEN, successMessage: "Rejected by XEN", variant: "danger" },
      { label: "Forward to PDC", endpoint: "/xen/approve-pdc", role: ROLES.XEN, successMessage: "Forwarded to PDC", variant: "primary" },
    ],
  },
  XEN_RETURNED_TO_LS: { label: "XEN Returned to LS", badgeClass: "bg-orange-100 text-orange-800", actions: [] },
  PDC_RETURNED_TO_LS: { label: "PDC Returned to LS", badgeClass: "bg-orange-100 text-orange-800", actions: [] },
  LS_RESUBMIT_TO_PDC: {
    label: "LS Resubmit to PDC",
    badgeClass: "bg-teal-100 text-teal-800",
    actions: [
      { label: "Delegate to GRID", endpoint: "/delegate-grid", role: ROLES.PDC, successMessage: "Delegated to GRID", variant: "primary" },
      { label: "Return to LS", endpoint: "/pdc/return-ls", role: ROLES.PDC, successMessage: "Returned to LS", variant: "outline-secondary" },
      { label: "Reject PTW", endpoint: "/pdc/reject", role: ROLES.PDC, successMessage: "Rejected by PDC", variant: "danger" },
    ],
  },
  PDC_REJECTED: { label: "PDC Rejected", badgeClass: "bg-red-100 text-red-800", actions: [] },
  CANCELLATION_APPROVED_BY_SDO: { label: "Cancellation Approved by SDO", badgeClass: "bg-yellow-100 text-yellow-800", actions: [] },
  PDC_CONFIRMED: {
    label: "PDC Confirmed",
    badgeClass: "bg-green-100 text-green-800",
    actions: [
      { label: "Start Execution", endpoint: "/start-execution", role: ROLES.LS, successMessage: "Execution started successfully", variant: "primary", requiresExecutionStart: true },
    ],
  },
  PENDING_PDC_CONFIRMATION: { label: "Pending PDC Confirmation", badgeClass: "bg-yellow-100 text-yellow-800", actions: [] },
  GRID_RESOLVE_REQUIRED: {
    label: "Grid Resolve Required",
    badgeClass: "bg-red-100 text-red-800",
    actions: [
      { label: "Resubmit after Resolution", endpoint: "/grid/resubmit-after-resolution", role: ROLES.GRID, successMessage: "Resubmitted after resolution", variant: "primary", requiresChecklist: true, checklistType: "GRID_PTW_ISSUE" },
    ],
  },
  RE_SUBMITTED_TO_PDC: { label: "Re-submitted to PDC", badgeClass: "bg-teal-100 text-teal-800", actions: [] },
  NO_PTW_APPROVED_BY_SDO: { label: "No PTW Approved by SDO", badgeClass: "bg-red-100 text-red-800", actions: [] },
};

// ---------- HELPERS ----------
const roleColor = (role: string): string => {
  const map: Record<string, string> = {
    LS: "bg-gray-500",
    SDO: "bg-amber-500",
    XEN: "bg-blue-500",
    PDC: "bg-teal-500",
    GRID: "bg-purple-500",
  };
  return map[role] || "bg-gray-400";
};

const chip = (val: "YES" | "NO" | null): JSX.Element => {
  const base =
    "px-2 w-20 flex justify-center items-center rounded-full text-xs font-medium border transition-colors";
  if (val === "YES")
    return <span className={`${base} border-green-200 bg-green-50 text-green-700`}>YES</span>;
  if (val === "NO")
    return <span className={`${base} border-red-200 bg-red-50 text-red-700`}>NO</span>;
  return <span className={`${base} border-slate-200 bg-slate-50 text-slate-600`}>Pending</span>;
};

const getGoogleMapsApiKey = (): string => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  ) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
  console.error(
    "Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY",
  );
  return "";
};

const mapContainerStyle = { width: "100%", height: "300px" };
const defaultCenter = { lat: 33.6844, lng: 73.0479 };

// ---------- COMPONENT ----------
export default function PTWPreviewPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PTWPreviewData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PtwAction | null>(null);
  const [notes, setNotes] = useState("");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, "YES" | "NO">>({});
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [feederSwitches, setFeederSwitches] = useState<Record<number, boolean>>({});
  const [isReturnToGridModalOpen, setIsReturnToGridModalOpen] = useState(false);
  const [returnToGridIssue, setReturnToGridIssue] = useState("");
  const [returnToGridNotes, setReturnToGridNotes] = useState("");
  const [proceedNotes, setProceedNotes] = useState("");

  // Execution start states
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [executionNotes, setExecutionNotes] = useState("");
  const [executionEvidence, setExecutionEvidence] = useState<{
    EXEC_CREW_PHOTO: File[];
    EXEC_TP_PPE_PICTURE: File[];
    EXEC_HT_LT_EARTHING_PICTURE: File[];
    EXEC_ADDITIONAL_PICTURE: File[];
  }>({
    EXEC_CREW_PHOTO: [],
    EXEC_TP_PPE_PICTURE: [],
    EXEC_HT_LT_EARTHING_PICTURE: [],
    EXEC_ADDITIONAL_PICTURE: [],
  });
  const [executionLocation, setExecutionLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [executionSubmitting, setExecutionSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Completion states
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionEvidence, setCompletionEvidence] = useState<File[]>([]);
  const [completionChecklistItems, setCompletionChecklistItems] = useState<ChecklistItem[]>([]);
  const [completionChecklistLoading, setCompletionChecklistLoading] = useState(false);
  const [completionAnswers, setCompletionAnswers] = useState<Record<number, "YES" | "NO">>({});
  const [completionLocation, setCompletionLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  const [completionPreviewImageUrl, setCompletionPreviewImageUrl] = useState<string | null>(null);

  // Grid Restore Close states
  const [isGridRestoreModalOpen, setIsGridRestoreModalOpen] = useState(false);
  const [gridRestoreNotes, setGridRestoreNotes] = useState("");
  const [gridRestoreEvidence, setGridRestoreEvidence] = useState<File[]>([]);
  const [gridRestoreChecklistItems, setGridRestoreChecklistItems] = useState<ChecklistItem[]>([]);
  const [gridRestoreChecklistLoading, setGridRestoreChecklistLoading] = useState(false);
  const [gridRestoreAnswers, setGridRestoreAnswers] = useState<Record<number, "YES" | "NO">>({});
  const [gridRestoreLocation, setGridRestoreLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gridRestoreSubmitting, setGridRestoreSubmitting] = useState(false);
  const [gridRestorePreviewImageUrl, setGridRestorePreviewImageUrl] = useState<string | null>(null);

  // Delegate to PDC states
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [delegatePdcId, setDelegatePdcId] = useState<number | null>(null);
  const [delegateReason, setDelegateReason] = useState("");
  const [delegateSubmitting, setDelegateSubmitting] = useState(false);

  // Google Maps for execution modal
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script-execution",
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ["places"],
  });
  const [executionMap, setExecutionMap] = useState<google.maps.Map | null>(null);
  const [executionMarker, setExecutionMarker] = useState(defaultCenter);
  const executionGeocoderRef = useRef<google.maps.Geocoder | null>(null);
  const executionDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Google Maps for completion modal
  const [completionMap, setCompletionMap] = useState<google.maps.Map | null>(null);
  const [completionMarker, setCompletionMarker] = useState(defaultCenter);
  const completionGeocoderRef = useRef<google.maps.Geocoder | null>(null);
  const completionDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Google Maps for grid restore modal
  const [gridRestoreMap, setGridRestoreMap] = useState<google.maps.Map | null>(null);
  const [gridRestoreMarker, setGridRestoreMarker] = useState(defaultCenter);
  const gridRestoreGeocoderRef = useRef<google.maps.Geocoder | null>(null);
  const gridRestoreDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // In a real app, use Redux instead of localStorage
  const authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const userRoles: string[] = authUser?.roles ?? [];

  // ---------- Fetch Data ----------
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await api.get<{ data: PTWPreviewData }>(`/api/v1/ptw/${id}/preview`);
        const ptwData = res.data.data;
        setData(ptwData);
        // Initialize feeder switches from API
        if (ptwData.ptw.primary_feeders) {
          const initialSwitches: Record<number, boolean> = {};
          Object.values(ptwData.ptw.primary_feeders).forEach((grid) => {
            grid.feeders.primary.forEach((f) => (initialSwitches[f.id] = f.is_on));
            grid.feeders.secondary.forEach((f) => (initialSwitches[f.id] = f.is_on));
          });
          setFeederSwitches(initialSwitches);
        }
      } catch (error) {
        toast.error(
          (error as any)?.response?.data?.message || "Failed to fetch PTW preview data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ---------- Submit Handler for simple notes actions ----------
  const handleSubmitNotes = async (url: string, successMsg: string) => {
    setSubmitting(true);
    try {
      const body: any = { notes };
      if (selectedAction?.requiresExtraFields && selectedAction.extraFields) {
        for (const field of selectedAction.extraFields) {
          body[field.name] = extraFields[field.name] || "";
        }
      }
      await api.patch(url, body);
      toast.success(successMsg);
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Submit Handler for checklist action ----------
  const handleSubmitChecklist = async () => {
    if (!selectedAction) return;
    if (Object.keys(answers).length !== checklistItems.length) {
      toast.error("Please answer all checklist items.");
      return;
    }
    if (evidenceFiles.length > 10) {
      toast.error("Maximum 10 evidence images allowed.");
      return;
    }
    for (const file of evidenceFiles) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Each file must be less than 1MB.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("notes", notes);
      checklistItems.forEach((item, index) => {
        formData.append(`answers[${index}][checklist_item_id]`, item.id.toString());
        formData.append(`answers[${index}][value]`, answers[item.id]);
      });
      evidenceFiles.forEach((file, index) => {
        formData.append(`evidences[${index}][file]`, file);
        formData.append(`evidences[${index}][type]`, "GRID_PTW_ISSUE");
      });

      await api.post(`/api/v1/ptw/${id}${selectedAction.endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(selectedAction.successMessage);
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
      setIsChecklistModalOpen(false);
    }
  };

  // ---------- Handler for Return to Grid ----------
  const handleReturnToGrid = async () => {
    setSubmitting(true);
    try {
      const feeders = Object.entries(feederSwitches).map(([id, isOn]) => ({
        id: Number(id),
        is_on: isOn,
      }));
      const body = {
        feeders,
        issue_description: returnToGridIssue,
        notes: returnToGridNotes,
      };
      await api.patch(`/api/v1/ptw/${id}/pdc/return-to-grid-for-resolution`, body);
      toast.success("Returned to Grid for resolution");
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
      setIsReturnToGridModalOpen(false);
    }
  };

  // ---------- Handler for Proceed ----------
  const handleProceed = async () => {
    const feeders = Object.entries(feederSwitches).map(([id, isOn]) => ({
      id: Number(id),
      is_on: isOn,
    }));
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/ptw/${id}/pdc/confirm-feeder-status`, {
        feeders,
        notes: proceedNotes,
      });
      toast.success("Feeder status confirmed");
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Execution Start Handlers ----------
  const handleExecutionFileChange = (type: string, files: File[]) => {
    const maxPerType = 5;
    const existing = executionEvidence[type as keyof typeof executionEvidence] || [];
    const combined = [...existing, ...files];
    if (combined.length > maxPerType) {
      toast.error(`Maximum ${maxPerType} files allowed for ${type.replaceAll("_", " ")}`);
      return;
    }
    const totalOther = Object.entries(executionEvidence).reduce((sum, [key, val]) => {
      if (key !== type) return sum + val.length;
      return sum;
    }, 0);
    if (totalOther + combined.length > 20) {
      toast.error("Total evidence files cannot exceed 20");
      return;
    }
    setExecutionEvidence((prev) => ({
      ...prev,
      [type]: combined,
    }));
  };

  const handleExecutionLocation = (lat: number, lng: number) => {
    setExecutionLocation({ lat, lng });
    setExecutionMarker({ lat, lng });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleExecutionLocation(latitude, longitude);
          executionMap?.panTo({ lat: latitude, lng: longitude });
          executionMap?.setZoom(15);
        },
        () => toast.error("Unable to get your location"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  const handleExecutionMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handleExecutionLocation(lat, lng);
    if (executionGeocoderRef.current) {
      if (executionDebounceTimerRef.current) clearTimeout(executionDebounceTimerRef.current);
      executionDebounceTimerRef.current = setTimeout(() => {
        executionGeocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            // We don't store address, just coordinates
          }
        });
      }, 300);
    }
  };

  const handleSubmitExecutionStart = async () => {
    const required = ["EXEC_CREW_PHOTO", "EXEC_TP_PPE_PICTURE", "EXEC_HT_LT_EARTHING_PICTURE"];
    for (const type of required) {
      if (!executionEvidence[type as keyof typeof executionEvidence]?.length) {
        toast.error(`Please upload at least one file for ${type.replaceAll("_", " ")}`);
        return;
      }
    }
    if (!executionLocation) {
      toast.error("Please set your current location");
      return;
    }
    setExecutionSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("notes", executionNotes);
      formData.append("current_lat", executionLocation.lat.toString());
      formData.append("current_lng", executionLocation.lng.toString());

      let evidenceIndex = 0;
      Object.entries(executionEvidence).forEach(([type, files]) => {
        files.forEach((file) => {
          formData.append(`evidences[${evidenceIndex}][type]`, type);
          formData.append(`evidences[${evidenceIndex}][file]`, file);
          evidenceIndex++;
        });
      });

      await api.post(`/api/v1/ptw/${id}/start-execution`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(selectedAction?.successMessage || "Execution started successfully");
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Failed to start execution");
    } finally {
      setExecutionSubmitting(false);
      setIsExecutionModalOpen(false);
    }
  };

  // ---------- Completion Handlers ----------
  const handleCompletionFileChange = (files: File[]) => {
    const maxFiles = 10;
    const combined = [...completionEvidence, ...files];
    if (combined.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB.`);
        return;
      }
    }
    setCompletionEvidence(combined);
  };

  const handleCompletionLocation = (lat: number, lng: number) => {
    setCompletionLocation({ lat, lng });
    setCompletionMarker({ lat, lng });
  };

  const handleGetCurrentCompletionLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleCompletionLocation(latitude, longitude);
          completionMap?.panTo({ lat: latitude, lng: longitude });
          completionMap?.setZoom(15);
        },
        () => toast.error("Unable to get your location"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  const handleCompletionMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handleCompletionLocation(lat, lng);
    if (completionGeocoderRef.current) {
      if (completionDebounceTimerRef.current) clearTimeout(completionDebounceTimerRef.current);
      completionDebounceTimerRef.current = setTimeout(() => {
        completionGeocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            // We don't store address, just coordinates
          }
        });
      }, 300);
    }
  };

  const handleSubmitCompletion = async () => {
    if (completionEvidence.length === 0) {
      toast.error("Please upload at least one evidence image.");
      return;
    }
    if (completionEvidence.length > 10) {
      toast.error("Maximum 10 evidence images allowed.");
      return;
    }
    if (Object.keys(completionAnswers).length !== completionChecklistItems.length) {
      toast.error("Please answer all checklist items.");
      return;
    }
    if (!completionLocation) {
      toast.error("Please set your current location");
      return;
    }
    setCompletionSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("notes", completionNotes);
      formData.append("current_lat", completionLocation.lat.toString());
      formData.append("current_lng", completionLocation.lng.toString());

      completionEvidence.forEach((file, index) => {
        formData.append(`evidences[${index}][type]`, "PTW_CANCELATION_OF_COMPLETION_BY_LS");
        formData.append(`evidences[${index}][file]`, file);
      });

      completionChecklistItems.forEach((item, index) => {
        formData.append(`checklist[${index}][checklist_item_id]`, item.id.toString());
        formData.append(`checklist[${index}][value]`, completionAnswers[item.id] || "NO");
      });

      await api.post(`/api/v1/ptw/${id}/completion-submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(selectedAction?.successMessage || "Completion submitted successfully");
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Failed to submit completion");
    } finally {
      setCompletionSubmitting(false);
      setIsCompletionModalOpen(false);
    }
  };

  // ---------- Grid Restore & Close Handlers ----------
  const handleGridRestoreFileChange = (files: File[]) => {
    const maxFiles = 10;
    const combined = [...gridRestoreEvidence, ...files];
    if (combined.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB.`);
        return;
      }
    }
    setGridRestoreEvidence(combined);
  };

  const handleGridRestoreLocation = (lat: number, lng: number) => {
    setGridRestoreLocation({ lat, lng });
    setGridRestoreMarker({ lat, lng });
  };

  const handleGetCurrentGridRestoreLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleGridRestoreLocation(latitude, longitude);
          gridRestoreMap?.panTo({ lat: latitude, lng: longitude });
          gridRestoreMap?.setZoom(15);
        },
        () => toast.error("Unable to get your location"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  const handleGridRestoreMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handleGridRestoreLocation(lat, lng);
    if (gridRestoreGeocoderRef.current) {
      if (gridRestoreDebounceTimerRef.current) clearTimeout(gridRestoreDebounceTimerRef.current);
      gridRestoreDebounceTimerRef.current = setTimeout(() => {
        gridRestoreGeocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            // We don't store address, just coordinates
          }
        });
      }, 300);
    }
  };

  const handleSubmitGridRestore = async () => {
    if (gridRestoreEvidence.length === 0) {
      toast.error("Please upload at least one evidence image.");
      return;
    }
    if (gridRestoreEvidence.length > 10) {
      toast.error("Maximum 10 evidence images allowed.");
      return;
    }
    if (Object.keys(gridRestoreAnswers).length !== gridRestoreChecklistItems.length) {
      toast.error("Please answer all checklist items.");
      return;
    }
    if (!gridRestoreLocation) {
      toast.error("Please set your current location");
      return;
    }
    setGridRestoreSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("notes", gridRestoreNotes);
      formData.append("current_lat", gridRestoreLocation.lat.toString());
      formData.append("current_lng", gridRestoreLocation.lng.toString());

      gridRestoreEvidence.forEach((file, index) => {
        formData.append(`evidences[${index}][type]`, "PTW_CANCEL_BY_GRID");
        formData.append(`evidences[${index}][file]`, file);
      });

      gridRestoreChecklistItems.forEach((item, index) => {
        formData.append(`checklist[${index}][checklist_item_id]`, item.id.toString());
        formData.append(`checklist[${index}][value]`, gridRestoreAnswers[item.id] || "NO");
      });

      await api.post(`/api/v1/ptw/${id}/mark-restored-and-closed`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(selectedAction?.successMessage || "PTW restored and closed");
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Failed to restore & close PTW");
    } finally {
      setGridRestoreSubmitting(false);
      setIsGridRestoreModalOpen(false);
    }
  };

  // ---------- Delegate to PDC Handler ----------
  const handleOpenDelegateModal = () => {
    setDelegatePdcId(null);
    setDelegateReason("");
    setIsDelegateModalOpen(true);
  };

  const handleSubmitDelegate = async () => {
    if (!delegatePdcId) {
      toast.error("Please select a PDC user to delegate to.");
      return;
    }
    setDelegateSubmitting(true);
    try {
      await api.patch(`/api/v1/ptw/${id}/delegate-to-pdc`, {
        to_pdc_id: delegatePdcId,
        reason: delegateReason,
      });
      toast.success("PTW delegated successfully");
      setIsDelegateModalOpen(false);
      navigate(-1);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || "Failed to delegate PTW");
    } finally {
      setDelegateSubmitting(false);
    }
  };

  // Auto-fetch location for grid restore modal
  useEffect(() => {
    if (!isGridRestoreModalOpen || !isLoaded) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleGridRestoreLocation(latitude, longitude);
          gridRestoreMap?.panTo({ lat: latitude, lng: longitude });
          gridRestoreMap?.setZoom(15);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.error("Unable to auto-fetch location. You can drag the marker or use the button.");
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported by this browser");
    }
  }, [isGridRestoreModalOpen, isLoaded, gridRestoreMap]);

  // Auto-fetch location for completion modal
  useEffect(() => {
    if (!isCompletionModalOpen || !isLoaded) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleCompletionLocation(latitude, longitude);
          completionMap?.panTo({ lat: latitude, lng: longitude });
          completionMap?.setZoom(15);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.error("Unable to auto-fetch location. You can drag the marker or use the button.");
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported by this browser");
    }
  }, [isCompletionModalOpen, isLoaded, completionMap]);

  // Auto-fetch location for execution modal
  useEffect(() => {
    if (!isExecutionModalOpen || !isLoaded) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          handleExecutionLocation(latitude, longitude);
          executionMap?.panTo({ lat: latitude, lng: longitude });
          executionMap?.setZoom(15);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.error("Unable to auto-fetch location. You can drag the marker or use the button.");
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation not supported by this browser");
    }
  }, [isExecutionModalOpen, isLoaded, executionMap]);

  const openModal = (action: PtwAction) => {
    setSelectedAction(action);
    setNotes("");
    setExtraFields({});
    if (action.requiresChecklist) {
      setIsChecklistModalOpen(true);
      setChecklistLoading(true);
      setAnswers({});
      setEvidenceFiles([]);
      api
        .get(`/api/v1/admin/checklists?type=${action.checklistType}`)
        .then((res) => {
          const firstChecklist = res.data.data?.[0];
          if (firstChecklist && firstChecklist.items) {
            setChecklistItems(firstChecklist.items);
          } else {
            setChecklistItems([]);
          }
        })
        .catch((error) => {
          toast.error(
            (error as any)?.response?.data?.message || "Failed to load checklist."
          );
        })
        .finally(() => setChecklistLoading(false));
    } else if (action.requiresExecutionStart) {
      setExecutionNotes("");
      setExecutionEvidence({
        EXEC_CREW_PHOTO: [],
        EXEC_TP_PPE_PICTURE: [],
        EXEC_HT_LT_EARTHING_PICTURE: [],
        EXEC_ADDITIONAL_PICTURE: [],
      });
      setExecutionLocation(null);
      setExecutionMarker(defaultCenter);
      setIsExecutionModalOpen(true);
    } else if (action.requiresCompletionSubmit) {
      setCompletionNotes("");
      setCompletionEvidence([]);
      setCompletionAnswers({});
      setCompletionChecklistLoading(true);
      setCompletionLocation(null);
      setCompletionMarker(defaultCenter);
      setIsCompletionModalOpen(true);
      api
        .get(`/api/v1/admin/checklists?type=PTW_CANCELATION_OF_COMPLETION_BY_LS`)
        .then((res) => {
          const firstChecklist = res.data.data?.[0];
          if (firstChecklist && firstChecklist.items) {
            const items = firstChecklist.items;
            setCompletionChecklistItems(items);
            const initial: Record<number, "YES" | "NO"> = {};
            items.forEach((item: ChecklistItem) => {
              initial[item.id] = "NO";
            });
            setCompletionAnswers(initial);
          } else {
            setCompletionChecklistItems([]);
            setCompletionAnswers({});
          }
        })
        .catch((error) => {
          toast.error(
            (error as any)?.response?.data?.message || "Failed to load completion checklist."
          );
        })
        .finally(() => setCompletionChecklistLoading(false));
    } else if (action.requiresGridRestoreClose) {
      setGridRestoreNotes("");
      setGridRestoreEvidence([]);
      setGridRestoreAnswers({});
      setGridRestoreChecklistLoading(true);
      setGridRestoreLocation(null);
      setGridRestoreMarker(defaultCenter);
      setIsGridRestoreModalOpen(true);
      api
        .get(`/api/v1/admin/checklists?type=PTW_CANCEL_BY_GRID`)
        .then((res) => {
          const firstChecklist = res.data.data?.[0];
          if (firstChecklist && firstChecklist.items) {
            const items = firstChecklist.items;
            setGridRestoreChecklistItems(items);
            const initial: Record<number, "YES" | "NO"> = {};
            items.forEach((item: ChecklistItem) => {
              initial[item.id] = "NO";
            });
            setGridRestoreAnswers(initial);
          } else {
            setGridRestoreChecklistItems([]);
            setGridRestoreAnswers({});
          }
        })
        .catch((error) => {
          toast.error(
            (error as any)?.response?.data?.message || "Failed to load grid restore checklist."
          );
        })
        .finally(() => setGridRestoreChecklistLoading(false));
    } else {
      setIsModalOpen(true);
    }
  };

  const handleConfirmSimple = async () => {
    if (!selectedAction) return;
    if (selectedAction.requiresExtraFields) {
      for (const field of selectedAction.extraFields || []) {
        if (field.required && !extraFields[field.name]?.trim()) {
          toast.error(`${field.label} is required.`);
          return;
        }
      }
    }
    await handleSubmitNotes(
      `/api/v1/ptw/${id}${selectedAction.endpoint}`,
      selectedAction.successMessage
    );
    setIsModalOpen(false);
    setSelectedAction(null);
  };

  const handleConfirmChecklist = () => {
    handleSubmitChecklist();
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading preview...
      </div>
    );

  if (!data)
    return <div className="p-6 text-center text-slate-500">No preview data found.</div>;

  const { ptw, checklists } = data;
  const logs = ptw.logs || [];
  const statusConfig = PTW_STATUS_CONFIG[ptw.current_status] || {
    label: ptw.current_status,
    badgeClass: "bg-slate-100 text-slate-700",
    actions: [],
  };

  const storageUrl = (p: string): string => {
    if (p.startsWith("http")) return p;
    const base = api.defaults.baseURL ?? window.location.origin;
    return `${new URL(base).origin}/storage/${p}`;
  };

  // Get visible actions for this user and conditions
  const visibleActions = statusConfig.actions.filter((action) => {
    const userHasRole = userRoles.some(
      (role) =>
        role.toLowerCase() === action.role.toLowerCase() ||
        (action.role === ROLES.GRID && role.toLowerCase() === "gridoperator")
    );
    return userHasRole && (!action.condition || action.condition(ptw));
  });

  // Edit condition
  const canEdit =
    (ptw.current_status === "SDO_RETURNED" ||
      ptw.current_status === "XEN_RETURNED_TO_LS" ||
      ptw.current_status === "PDC_RETURNED_TO_LS") &&
    userRoles.some((role) => role.toLowerCase() === "ls");

  // Delegate condition
  const activePdcUsers = data?.active_pdc_users ?? [];
  const otherPdcUsers = activePdcUsers.filter((u) => !u.is_current_user);
  const canDelegate =
    userRoles.some((role) => role.toLowerCase() === "pdc") && otherPdcUsers.length > 0;

  // Flatten feeders with grid info
  const allFeeders: (Feeder & { type: "primary" | "secondary"; grid_code: string; grid_id: number })[] = [];
  if (ptw.primary_feeders) {
    Object.values(ptw.primary_feeders).forEach((grid) => {
      grid.feeders.primary.forEach((f) =>
        allFeeders.push({ ...f, type: "primary", grid_code: grid.grid_code, grid_id: grid.grid_id })
      );
      grid.feeders.secondary.forEach((f) =>
        allFeeders.push({ ...f, type: "secondary", grid_code: grid.grid_code, grid_id: grid.grid_id })
      );
    });
  }

  const isPdcOnIssued =
    (ptw.current_status === "PTW_ISSUED" || ptw.current_status === "RE_SUBMITTED_TO_PDC") &&
    userRoles.some((role) => role.toLowerCase() === ROLES.PDC.toLowerCase());

  const allFeedersOff = allFeeders.length > 0 && allFeeders.every((f) => !feederSwitches[f.id]);

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* HEADER */}
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Permit to Work (PTW) Preview</h1>
              <p className="text-xs text-slate-500" dir="rtl">ورک پرمٹ کا خلاصہ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
            <Button variant="outline-secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* SUMMARY */}
        <motion.div className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-base font-semibold mb-4 border-b pb-2">Summary / خلاصہ</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm leading-relaxed">
            <div>
              <p><b>PTW Code:</b> {ptw.ptw_code}</p>
              <p><b>Work Order:</b> {ptw.work_order_no}</p>
              <p><b>Type:</b> {ptw.type} ({ptw.misc_type})</p>
              <p><b>Subdivision:</b> {ptw.sub_division_name}</p>
              <p><b>Feeder:</b> {ptw.feeder_name}</p>
              <p><b>Transformer:</b> {ptw.transformer_name}</p>
              <p><b>PTW Required:</b> {ptw.is_ptw_required ? "Yes" : "No"}</p>
            </div>
            <div>
              <p><b>Scheduled Start:</b> {ptw.scheduled_start_at}</p>
              <p><b>Duration:</b> {ptw.estimated_duration_min} mins</p>
              <p><b>Switch Off:</b> {ptw.switch_off_time}</p>
              <p><b>Restore:</b> {ptw.restore_time}</p>
              <p><b>Close / Alternate Feeder:</b> {ptw.close_feeder} / {ptw.alternate_feeder}</p>
              <p><b>Feeder Incharge:</b> {ptw.feeder_incharge_name}</p>
            </div>
          </div>
        </motion.div>

        {/* WORK DETAILS */}
        <motion.div className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-base font-semibold mb-4 border-b pb-2">Work Details / کام کی تفصیل</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <p><b>Place of Work:</b> {ptw.place_of_work}</p>
            <p><b>Scope of Work:</b> {ptw.scope_of_work}</p>
            <p><b>Safety Arrangements:</b> {ptw.safety_arrangements}</p>
            <p><b>Location:</b> {ptw.location || "—"}</p>
          </div>
        </motion.div>

        {/* TEAM MEMBERS */}
        <motion.div className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-base font-semibold mb-4 border-b pb-2">Team Members / ٹیم ممبرز</h2>
          {ptw.team_members?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ptw.team_members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 border rounded-xl p-3 hover:shadow-sm transition">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-500">ID: {m.id}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No team members added.</p>
          )}
        </motion.div>

        {/* EVIDENCE */}
        <motion.div className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-base font-semibold mb-4 border-b pb-2">Evidence Photos / شواہد</h2>
          {ptw.evidences?.length ? (
            <div className="flex flex-wrap gap-4">
              {ptw.evidences.map((e) => (
                <div key={e.id} className="w-32">
                  <img src={storageUrl(e.file_path)} alt={e.type} className="w-32 h-28 object-cover border rounded-lg shadow-sm hover:scale-105 transition" />
                  <p className="text-[11px] text-center mt-1 text-slate-600">{e.type.replaceAll("_", " ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No evidence available.</p>
          )}
        </motion.div>

        {/* CHECKLISTS */}
        {(Object.keys(checklists) as Array<keyof typeof checklists>).map((key) => (
          <motion.div key={key} className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-base font-semibold mb-4 border-b pb-2">{key.replaceAll("_", " ")} Checklist</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {checklists[key]?.map((item) => (
                <div key={item.id} className="flex justify-between border rounded-lg p-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium">{item.label_en}</p>
                    <p className="text-xs text-slate-500" dir="rtl">{item.label_ur}</p>
                  </div>
                  {chip(item.value)}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* FEEDER SECTION for PDC on PTW_ISSUED */}
        {isPdcOnIssued && (
          <motion.div className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-base font-semibold mb-4 border-b pb-2">Feeder Status / فیڈر کی صورتحال</h2>
            <p className="text-sm text-slate-500 mb-4">Toggle each feeder ON or OFF. If any feeder remains ON, you must return to Grid.</p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {allFeeders.map((feeder) => (
                <div key={feeder.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${feeder.type === "primary" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                      {feeder.type}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{feeder.name}</p>
                      <p className="text-xs text-slate-500">Grid: {feeder.grid_code} | Code: {feeder.code}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={feederSwitches[feeder.id]} onChange={(e) => setFeederSwitches((prev) => ({ ...prev, [feeder.id]: e.target.checked }))} />
                    <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${feederSwitches[feeder.id] ? 'bg-green-500 after:translate-x-full' : 'bg-gray-200'}`}></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">{feederSwitches[feeder.id] ? "ON" : "OFF"}</span>
                  </label>
                </div>
              ))}
            </div>
            {allFeedersOff && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Notes for Proceed (optional)</label>
                <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter notes" rows={2} value={proceedNotes} onChange={(e) => setProceedNotes(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3 mt-6">
              {!allFeedersOff && (
                <Button variant="outline-secondary" onClick={() => { setReturnToGridIssue(""); setReturnToGridNotes(""); setIsReturnToGridModalOpen(true); }}>
                  Return to Grid
                </Button>
              )}
              {allFeedersOff && (
                <Button variant="primary" disabled={submitting} onClick={handleProceed}>
                  {submitting ? "Submitting..." : "Proceed"}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* AVAILABLE ACTIONS */}
        {(visibleActions.length > 0 || canEdit || canDelegate) && (
          <motion.div className="border rounded-2xl bg-white p-6 shadow-md space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-base font-semibold border-b pb-2">Available Actions / دستیاب کارروائیاں</h2>
            <div className="flex flex-wrap gap-3">
              {canEdit && (
                <Button key="edit" variant="primary" onClick={() => navigate(`/ptw?id=${ptw.id}`)} className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Edit PTW
                </Button>
              )}
              {canDelegate && (
                <Button key="delegate" variant="outline-secondary" onClick={handleOpenDelegateModal} className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Delegate to PDC
                </Button>
              )}
              {visibleActions.map((action) => (
                <Button key={action.endpoint} variant={action.variant || "primary"} onClick={() => openModal(action)} className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> {action.label}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* LOGS */}
        {logs.length > 0 && (
          <motion.div className="border rounded-2xl bg-white p-6 shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-base font-semibold mb-4 border-b pb-2">Activity Logs / کارروائی کی تفصیل</h2>
            <ol className="relative border-l-2 border-blue-200 pl-6 space-y-5">
              {logs.map((log, i) => (
                <li key={log.id} className="relative">
                  <span className={`absolute -left-[3.3%] top-0 flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] ${roleColor(log.role)}`}>{i + 1}</span>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-slate-800">{log.actor_name} ({log.role})</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {log.created_at}</div>
                  </div>
                  <p className="mt-1 text-sm text-slate-700 italic">“{log.notes || "—"}”</p>
                  <div className="text-xs text-slate-500 mt-1">Action: <b>{log.action}</b></div>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </div>

      {/* SIMPLE NOTES MODAL */}
      {isModalOpen && selectedAction && !selectedAction.requiresChecklist && !selectedAction.requiresExecutionStart && !selectedAction.requiresCompletionSubmit && !selectedAction.requiresGridRestoreClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">{selectedAction.label}</h3>
            <p className="text-sm text-slate-500 mb-4">Add optional notes for this action.</p>
            {selectedAction.requiresExtraFields && selectedAction.extraFields?.map((field) => (
              <div key={field.name} className="mb-4">
                <label className="block text-sm font-medium mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder={field.placeholder || ""} rows={3} value={extraFields[field.name] || ""} onChange={(e) => setExtraFields((prev) => ({ ...prev, [field.name]: e.target.value }))} />
              </div>
            ))}
            <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter notes (optional)" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={submitting} onClick={handleConfirmSimple}>{submitting ? "Submitting..." : "Confirm"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKLIST MODAL (GRID) */}
      {isChecklistModalOpen && selectedAction && selectedAction.requiresChecklist && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
    <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl my-8">
      <h3 className="text-lg font-semibold mb-2">{selectedAction.label}</h3>
      {checklistLoading ? (
        <div className="py-10 text-center text-slate-500">Loading checklist...</div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">Mark each item as completed.</p>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {checklistItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 flex items-start gap-3">
                <label className="mt-1 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={answers[item.id] === "YES"}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [item.id]: e.target.checked ? "YES" : "NO",
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label_en}</p>
                  <p className="text-xs text-slate-500" dir="rtl">{item.label_ur}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Evidence Images (max 10, each ≤ 1MB)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 10) {
                  toast.error("Maximum 10 images allowed.");
                  return;
                }
                for (const file of files) {
                  if (file.size > 1 * 1024 * 1024) {
                    toast.error(`${file.name} exceeds 1MB.`);
                    return;
                  }
                }
                setEvidenceFiles(files);
              }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {/* ✅ Thumbnail previews */}
            {evidenceFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {evidenceFiles.map((file, idx) => (
                  <img
                    key={idx}
                    src={URL.createObjectURL(file)}
                    alt={`preview-${idx}`}
                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline-secondary" onClick={() => setIsChecklistModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={submitting} onClick={handleConfirmChecklist}>
              {submitting ? "Submitting..." : "Confirm"}
            </Button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      {/* RETURN TO GRID MODAL */}
      {isReturnToGridModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Return to Grid</h3>
            <p className="text-sm text-slate-500 mb-4">Provide details for returning the PTW to Grid.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Issue Description <span className="text-red-500">*</span></label>
              <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Describe the issue..." rows={3} value={returnToGridIssue} onChange={(e) => setReturnToGridIssue(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter notes" rows={3} value={returnToGridNotes} onChange={(e) => setReturnToGridNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setIsReturnToGridModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={submitting || !returnToGridIssue.trim()} onClick={handleReturnToGrid}>{submitting ? "Submitting..." : "Confirm"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTION START MODAL */}
      {isExecutionModalOpen && selectedAction?.requiresExecutionStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 shadow-xl my-8">
            <h3 className="text-lg font-semibold mb-2">Start Execution</h3>
            <p className="text-sm text-slate-500 mb-4">Provide evidence, notes, and current location.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: "EXEC_CREW_PHOTO", label: "Crew Photo", required: true },
                { type: "EXEC_TP_PPE_PICTURE", label: "TP PPE Picture", required: true },
                { type: "EXEC_HT_LT_EARTHING_PICTURE", label: "HT/LT Earthing Picture", required: true },
                { type: "EXEC_ADDITIONAL_PICTURE", label: "Additional Picture", required: false },
              ].map((item) => (
                <div key={item.type} className="border rounded-lg p-3">
                  <label className="block text-sm font-medium mb-1">{item.label} {item.required && <span className="text-red-500">*</span>}<span className="text-xs text-slate-400 ml-2">(max 5)</span></label>
                  <input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); handleExecutionFileChange(item.type, files); }} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  {executionEvidence[item.type as keyof typeof executionEvidence].length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {executionEvidence[item.type as keyof typeof executionEvidence].map((file, idx) => (
                        <img key={idx} src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80" onClick={() => setPreviewImageUrl(URL.createObjectURL(file))} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter notes" rows={2} value={executionNotes} onChange={(e) => setExecutionNotes(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Current Location</label>
              {loadError ? (
                <div className="rounded-lg bg-red-50 p-4 text-red-600">Error loading Google Maps. Please check your API key.</div>
              ) : !isLoaded ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-slate-100">Loading map...</div>
              ) : (
                <>
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={executionMarker} zoom={15} onLoad={(map) => { setExecutionMap(map); executionGeocoderRef.current = new window.google.maps.Geocoder(); }}>
                    <Marker position={executionMarker} draggable onDragEnd={handleExecutionMarkerDragEnd} />
                  </GoogleMap>
                  <Button type="button" variant="outline-secondary" className="mt-2" onClick={handleGetCurrentLocation}>Use my current location</Button>
                  {executionLocation && <p className="text-xs text-slate-500 mt-1">Lat: {executionLocation.lat.toFixed(6)}, Lng: {executionLocation.lng.toFixed(6)}</p>}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline-secondary" onClick={() => setIsExecutionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={executionSubmitting} onClick={handleSubmitExecutionStart}>{executionSubmitting ? "Submitting..." : "Confirm Start"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETION SUBMIT MODAL */}
      {isCompletionModalOpen && selectedAction?.requiresCompletionSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 shadow-xl my-8">
            <h3 className="text-lg font-semibold mb-2">Complete PTW</h3>
            <p className="text-sm text-slate-500 mb-4">Provide checklist, evidence, and current location.</p>
            <div className="border rounded-lg p-3 mb-4">
              <label className="block text-sm font-medium mb-2">Evidence Images (max 10, each ≤ 5MB) <span className="text-red-500">*</span></label>
              <input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); handleCompletionFileChange(files); }} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {completionEvidence.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {completionEvidence.map((file, idx) => (
                    <img key={idx} src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80" onClick={() => setCompletionPreviewImageUrl(URL.createObjectURL(file))} />
                  ))}
                </div>
              )}
            </div>
            {completionChecklistLoading ? (
              <div className="py-6 text-center text-slate-500">Loading checklist...</div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-4">
                {completionChecklistItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 flex items-start gap-3">
                    <label className="mt-1 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={completionAnswers[item.id] === "YES"} onChange={(e) => setCompletionAnswers((prev) => ({ ...prev, [item.id]: e.target.checked ? "YES" : "NO" }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </label>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label_en}</p>
                      <p className="text-xs text-slate-500" dir="rtl">{item.label_ur}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter notes" rows={2} value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Location</label>
              {loadError ? (
                <div className="rounded-lg bg-red-50 p-4 text-red-600">Error loading Google Maps. Please check your API key.</div>
              ) : !isLoaded ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-slate-100">Loading map...</div>
              ) : (
                <>
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={completionMarker} zoom={15} onLoad={(map) => { setCompletionMap(map); completionGeocoderRef.current = new window.google.maps.Geocoder(); }}>
                    <Marker position={completionMarker} draggable onDragEnd={handleCompletionMarkerDragEnd} />
                  </GoogleMap>
                  <Button type="button" variant="outline-secondary" className="mt-2" onClick={handleGetCurrentCompletionLocation}>Use my current location</Button>
                  {completionLocation && <p className="text-xs text-slate-500 mt-1">Lat: {completionLocation.lat.toFixed(6)}, Lng: {completionLocation.lng.toFixed(6)}</p>}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline-secondary" onClick={() => setIsCompletionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={completionSubmitting} onClick={handleSubmitCompletion}>{completionSubmitting ? "Submitting..." : "Confirm Submit"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* GRID RESTORE MODAL */}
      {isGridRestoreModalOpen && selectedAction?.requiresGridRestoreClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 shadow-xl my-8">
            <h3 className="text-lg font-semibold mb-2">Restore & Close PTW</h3>
            <p className="text-sm text-slate-500 mb-4">Complete checklist, upload evidence, and provide current location.</p>
            <div className="border rounded-lg p-3 mb-4">
              <label className="block text-sm font-medium mb-2">Evidence Images (max 10, each ≤ 5MB) <span className="text-red-500">*</span></label>
              <input type="file" multiple accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); handleGridRestoreFileChange(files); }} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {gridRestoreEvidence.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {gridRestoreEvidence.map((file, idx) => (
                    <img key={idx} src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80" onClick={() => setGridRestorePreviewImageUrl(URL.createObjectURL(file))} />
                  ))}
                </div>
              )}
            </div>
            {gridRestoreChecklistLoading ? (
              <div className="py-6 text-center text-slate-500">Loading checklist...</div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-4">
                {gridRestoreChecklistItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 flex items-start gap-3">
                    <label className="mt-1 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={gridRestoreAnswers[item.id] === "YES"} onChange={(e) => setGridRestoreAnswers((prev) => ({ ...prev, [item.id]: e.target.checked ? "YES" : "NO" }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </label>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label_en}</p>
                      <p className="text-xs text-slate-500" dir="rtl">{item.label_ur}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter notes" rows={2} value={gridRestoreNotes} onChange={(e) => setGridRestoreNotes(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Location</label>
              {loadError ? (
                <div className="rounded-lg bg-red-50 p-4 text-red-600">Error loading Google Maps. Please check your API key.</div>
              ) : !isLoaded ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-slate-100">Loading map...</div>
              ) : (
                <>
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={gridRestoreMarker} zoom={15} onLoad={(map) => { setGridRestoreMap(map); gridRestoreGeocoderRef.current = new window.google.maps.Geocoder(); }}>
                    <Marker position={gridRestoreMarker} draggable onDragEnd={handleGridRestoreMarkerDragEnd} />
                  </GoogleMap>
                  <Button type="button" variant="outline-secondary" className="mt-2" onClick={handleGetCurrentGridRestoreLocation}>Use my current location</Button>
                  {gridRestoreLocation && <p className="text-xs text-slate-500 mt-1">Lat: {gridRestoreLocation.lat.toFixed(6)}, Lng: {gridRestoreLocation.lng.toFixed(6)}</p>}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline-secondary" onClick={() => setIsGridRestoreModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={gridRestoreSubmitting} onClick={handleSubmitGridRestore}>{gridRestoreSubmitting ? "Submitting..." : "Confirm Restore & Close"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* DELEGATE TO PDC MODAL */}
      {isDelegateModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delegate to PDC</h3>
            <p className="text-sm text-slate-500 mb-4">Select an active PDC user and provide a reason.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select PDC User</label>
                <select className="w-full border rounded-lg p-2 text-sm" value={delegatePdcId ?? ""} onChange={(e) => setDelegatePdcId(Number(e.target.value))}>
                  <option value="">Choose...</option>
                  {otherPdcUsers.map((pdc) => (
                    <option key={pdc.id} value={pdc.id}>{pdc.name} ({pdc.sap_code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="e.g., I am going off duty, delegating to my colleague" value={delegateReason} onChange={(e) => setDelegateReason(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline-secondary" onClick={() => setIsDelegateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={delegateSubmitting} onClick={handleSubmitDelegate}>{delegateSubmitting ? "Submitting..." : "Delegate"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX OVERLAYS */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setPreviewImageUrl(null)}>
          <img src={previewImageUrl} alt="Large preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
      {completionPreviewImageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setCompletionPreviewImageUrl(null)}>
          <img src={completionPreviewImageUrl} alt="Large preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
      {gridRestorePreviewImageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setGridRestorePreviewImageUrl(null)}>
          <img src={gridRestorePreviewImageUrl} alt="Large preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}