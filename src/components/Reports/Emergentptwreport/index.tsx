import React, { useMemo, useState, useEffect, useRef } from "react";
import Button from "@/components/Base/Button";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { api } from "@/lib/axios";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OptionItem {
  value: number;
  label: string;
}

interface EmergentPTWRecord {
  sr_no: number;
  circle: string;
  division: string;
  grid_station: string;
  feeder_name: string;
  feeder_code: string;
  sub_division: string;
  permit_number: string;
  from_time: string;
  to_time: string;
  duration: string;
  reason: string;
}

interface EmergentPTWPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

interface EmergentPTWReportData {
  title: string;
  generated_at: string;
  applied_filters: {
    region_id: number | null;
    circle_id: number | null;
    division_id: number | null;
    sub_division_id: number | null;
    statuses?: string[];
    from: string;
    to: string;
  };
  total_entries: number;
  detailed_records: EmergentPTWRecord[];
  pagination?: EmergentPTWPagination;
  // Flat fallbacks
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

interface EmergentPTWItem {
  id: number;
  sr_no: number;
  circle_name: string;
  division_name: string;
  grid_station: string;
  feeder_name: string;
  feeder_code: string;
  sub_division_name: string;
  permit_number: string;
  permit_from: string;
  permit_to: string;
  duration: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------

const PTW_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "SDO_RETURNED", label: "SDO Returned" },
  { value: "SDO_CANCELLED", label: "SDO Cancelled" },
  { value: "SDO_FORWARDED_TO_XEN", label: "SDO Forwarded to XEN" },
  { value: "XEN_RETURNED_TO_SDO", label: "XEN Returned to SDO" },
  { value: "XEN_REJECTED", label: "XEN Rejected" },
  { value: "XEN_APPROVED_TO_PDC", label: "XEN Approved to PDC" },
  { value: "PDC_DELEGATED_TO_GRID", label: "PDC Delegated to GRID" },
  { value: "GRID_PRECHECKS_DONE", label: "GRID Prechecks Done" },
  { value: "PTW_ISSUED", label: "PTW Issued" },
  { value: "IN_EXECUTION", label: "In Execution" },
  { value: "COMPLETION_SUBMITTED", label: "Completion Submitted" },
  { value: "GRID_RESTORED_AND_CLOSED", label: "Grid Restored and Closed" },
  { value: "CANCELLATION_REQUESTED_BY_LS", label: "Cancellation Requested by LS" },
  { value: "GRID_CANCELLATION_CONFIRMED_AND_CLOSED", label: "Grid Cancellation Confirmed & Closed" },
  { value: "LS_RESUBMIT_TO_XEN", label: "LS Resubmit to XEN" },
  { value: "XEN_RETURNED_TO_LS", label: "XEN Returned to LS" },
  { value: "PDC_RETURNED_TO_LS", label: "PDC Returned to LS" },
  { value: "LS_RESUBMIT_TO_PDC", label: "LS Resubmit to PDC" },
  { value: "PDC_REJECTED", label: "PDC Rejected" },
  { value: "CANCELLATION_APPROVED_BY_SDO", label: "Cancellation Approved by SDO" },
  { value: "PDC_CONFIRMED", label: "PDC Confirmed" },
  { value: "PENDING_PDC_CONFIRMATION", label: "Pending PDC Confirmation" },
  { value: "GRID_RESOLVE_REQUIRED", label: "Grid Resolve Required" },
  { value: "RE_SUBMITTED_TO_PDC", label: "Re-submitted to PDC" },
  { value: "NO_PTW_APPROVED_BY_SDO", label: "No PTW Approved by SDO" },
];

// ---------------------------------------------------------------------------
// Multi-select dropdown
// ---------------------------------------------------------------------------

const MultiSelectDropdown: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, options, selected, onChange, placeholder = "All", disabled }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = () => onChange([]);

  const displayLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} statuses selected`;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] font-semibold text-blue-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(opt.value)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={
                    isSelected
                      ? "font-semibold text-slate-800 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-300"
                  }
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const Main = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Hierarchy states
  const [circles, setCircles] = useState<OptionItem[]>([]);
  const [divisions, setDivisions] = useState<OptionItem[]>([]);
  const [subDivisions, setSubDivisions] = useState<OptionItem[]>([]);
  const [isCirclesLoading, setIsCirclesLoading] = useState(false);
  const [isDivisionsLoading, setIsDivisionsLoading] = useState(false);
  const [isSubDivisionsLoading, setIsSubDivisionsLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    circle_id: 0,
    division_id: 0,
    sub_division_id: 0,
    statuses: [] as string[],
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(50);
  const PER_PAGE_OPTIONS = [50, 100, 500, 1000] as const;

  // Report
  const [reportData, setReportData] = useState<EmergentPTWReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Derived
  const selectedCircleId = filters.circle_id > 0 ? filters.circle_id : null;
  const selectedDivisionId = filters.division_id > 0 ? filters.division_id : null;

  // Fetch circles on mount (region removed)
  useEffect(() => {
    const fetchCircles = async () => {
      setIsCirclesLoading(true);
      try {
        const res = await api.get(`/api/v1/meta/circles`);
        const data = res.data?.data ?? res.data;
        setCircles(
          Array.isArray(data) ? data.map((c: any) => ({ value: c.id, label: c.name })) : []
        );
      } catch (err) {
        console.error("Failed to load circles", err);
      } finally {
        setIsCirclesLoading(false);
      }
    };
    fetchCircles();
  }, []);

  // Fetch divisions when circle changes
  useEffect(() => {
    if (!selectedCircleId) {
      setDivisions([]);
      return;
    }
    const fetchDivisions = async () => {
      setIsDivisionsLoading(true);
      try {
        const res = await api.get(`/api/v1/meta/divisions?circle_id=${selectedCircleId}`);
        const data = res.data?.data ?? res.data;
        setDivisions(
          Array.isArray(data) ? data.map((d: any) => ({ value: d.id, label: d.name })) : []
        );
      } catch (err) {
        console.error("Failed to load divisions", err);
      } finally {
        setIsDivisionsLoading(false);
      }
    };
    fetchDivisions();
  }, [selectedCircleId]);

  // Fetch sub-divisions when division changes
  useEffect(() => {
    if (!selectedDivisionId) {
      setSubDivisions([]);
      return;
    }
    const fetchSubDivisions = async () => {
      setIsSubDivisionsLoading(true);
      try {
        const res = await api.get(`/api/v1/meta/sub-divisions?division_id=${selectedDivisionId}`);
        const data = res.data?.data ?? res.data;
        setSubDivisions(
          Array.isArray(data) ? data.map((sd: any) => ({ value: sd.id, label: sd.name })) : []
        );
      } catch (err) {
        console.error("Failed to load sub-divisions", err);
      } finally {
        setIsSubDivisionsLoading(false);
      }
    };
    fetchSubDivisions();
  }, [selectedDivisionId]);

  const canGenerate = useMemo(() => {
    if (!filters.from_date || !filters.to_date) return false;
    if (filters.from_date > filters.to_date) return false;
    return true;
  }, [filters]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "circle_id") {
      const circleId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({ ...prev, circle_id: circleId, division_id: 0, sub_division_id: 0 }));
      setPage(1);
    } else if (name === "division_id") {
      const divisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({ ...prev, division_id: divisionId, sub_division_id: 0 }));
      setPage(1);
    } else if (name === "sub_division_id") {
      const subDivisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({ ...prev, sub_division_id: subDivisionId }));
      setPage(1);
    } else if (name === "from_date" || name === "to_date") {
      setFilters((prev) => ({ ...prev, [name]: value }));
      setPage(1);
    }
  };

  const onStatusesChange = (next: string[]) => {
    setFilters((prev) => ({ ...prev, statuses: next }));
    setPage(1);
  };

  // -------- Build query params --------
  const buildParams = (opts?: { pageOverride?: number; perPageOverride?: number }) => {
    const params: any = {
      from: filters.from_date,
      to: filters.to_date,
      per_page: opts?.perPageOverride ?? perPage,
      page: opts?.pageOverride ?? page,
    };
    if (filters.circle_id > 0) params.circle_id = filters.circle_id;
    if (filters.division_id > 0) params.division_id = filters.division_id;
    if (filters.sub_division_id > 0) params.sub_division_id = filters.sub_division_id;
    if (filters.statuses.length > 0) params.statuses = filters.statuses;
    return params;
  };

  const fetchReport = async (opts?: { pageOverride?: number; perPageOverride?: number }) => {
    setIsReportLoading(true);
    try {
      const params = buildParams(opts);
      const response = await api.get("/api/v1/meta/reports/emergent-ptw", {
        params,
        paramsSerializer: {
          indexes: null, // statuses[]=X&statuses[]=Y
        },
      });
      const apiData = response.data?.data ?? response.data;

      const mappedItems: EmergentPTWItem[] = (apiData.detailed_records ?? []).map(
        (rec: EmergentPTWRecord, index: number) => ({
          id: index,
          sr_no: rec.sr_no,
          circle_name: rec.circle,
          division_name: rec.division,
          grid_station: rec.grid_station,
          feeder_name: rec.feeder_name,
          feeder_code: rec.feeder_code,
          sub_division_name: rec.sub_division,
          permit_number: rec.permit_number,
          permit_from: rec.from_time,
          permit_to: rec.to_time,
          duration: rec.duration,
          reason: rec.reason,
        })
      );

      // Read pagination from nested object, with flat fallback
      const pag: EmergentPTWPagination | undefined = apiData.pagination;

      setReportData({
        ...apiData,
        items: mappedItems,
        total_entries:
          pag?.total ?? apiData.total_entries ?? mappedItems.length,
        current_page:
          pag?.current_page ?? apiData.current_page ?? opts?.pageOverride ?? page,
        last_page: pag?.last_page ?? apiData.last_page ?? 1,
        per_page:
          pag?.per_page ?? apiData.per_page ?? opts?.perPageOverride ?? perPage,
        report_date: apiData.applied_filters?.to,
      } as any);
      setHasGenerated(true);
    } catch (err: any) {
      console.error("Failed to generate report", err);
      toast.error(err?.response?.data?.message || "Failed to generate report.");
    } finally {
      setIsReportLoading(false);
    }
  };

  const onGenerate = async () => {
    if (!canGenerate) return;
    setPage(1);
    await fetchReport({ pageOverride: 1 });
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1) return;
    const lastPage = reportData?.last_page ?? 1;
    if (nextPage > lastPage) return;
    setPage(nextPage);
    await fetchReport({ pageOverride: nextPage });
  };

  const handlePerPageChange = async (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
    await fetchReport({ perPageOverride: nextPerPage, pageOverride: 1 });
  };

  // -------- Derived data --------
  const data = reportData
    ? {
        ...reportData,
        items: (reportData as any).items as EmergentPTWItem[],
        filters: {
          from_date: reportData.applied_filters.from,
          to_date: reportData.applied_filters.to,
          circle_id: reportData.applied_filters.circle_id
            ? String(reportData.applied_filters.circle_id)
            : undefined,
          division_id: reportData.applied_filters.division_id
            ? String(reportData.applied_filters.division_id)
            : undefined,
          sub_division_id: reportData.applied_filters.sub_division_id
            ? String(reportData.applied_filters.sub_division_id)
            : undefined,
          statuses: reportData.applied_filters.statuses ?? [],
        },
        report_date: reportData.applied_filters.to,
      }
    : null;

  // -------- PDF --------
  const loadPngAsResizedDataURL = async (
    url: string,
    targetMaxWidthPx = 220
  ): Promise<string> => {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Failed to load image: ${url}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(1, targetMaxWidthPx / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, w, h);
        ctx?.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  };

  const handleDownloadPDF = async () => {
    if (!data || !data.items.length) {
      toast.error("No report data available to download.");
      return;
    }
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
        precision: 2,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const headerTop = 10;
      let logoDataUrl: string | null = null;
      try {
        logoDataUrl = await loadPngAsResizedDataURL("/logo.png", 150);
      } catch (e) {
        console.warn("Logo load failed, continuing without logo.", e);
      }
      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, "PNG", 10, headerTop - 4, 22, 22);
      }

      const hasLogo = !!logoDataUrl;
      const logoW = hasLogo ? 22 : 0;
      const logoX = 10;
      const logoGap = hasLogo ? 6 : 0;
      const leftX = hasLogo ? logoX + logoW + logoGap : 10;
      const usableWidth = pageWidth - leftX - 10;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(
        `Detail of Emergent PTWs In Respect of MEPCO on Date ${data.report_date || ""}`,
        pageWidth / 2,
        headerTop + 2,
        { align: "center" }
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        headerTop + 7,
        { align: "center" }
      );

      const cp = reportData?.current_page ?? 1;
      const lp = reportData?.last_page ?? 1;
      pdf.setFontSize(9);
      pdf.text(
        `Page ${cp} of ${lp}   |   Total Entries: ${reportData?.total_entries ?? data.items.length}   |   Date Range: ${data.filters.from_date} to ${data.filters.to_date}`,
        pageWidth / 2,
        headerTop + 13,
        { align: "center" }
      );

      const filterLines: string[] = [];
      if (data.filters.circle_id) filterLines.push(`Circle ID: ${data.filters.circle_id}`);
      if (data.filters.division_id) filterLines.push(`Division ID: ${data.filters.division_id}`);
      if (data.filters.sub_division_id)
        filterLines.push(`Sub Division ID: ${data.filters.sub_division_id}`);
      if (data.filters.statuses && data.filters.statuses.length > 0) {
        filterLines.push(`Statuses: ${data.filters.statuses.join(", ")}`);
      }
      filterLines.push(`From: ${data.filters.from_date}`);
      filterLines.push(`To: ${data.filters.to_date}`);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Applied Filters:", leftX, headerTop + 18);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const filtersText = filterLines.join("   |   ");
      const wrapped = pdf.splitTextToSize(filtersText, usableWidth);
      pdf.text(wrapped, leftX, headerTop + 22);

      const filtersHeight = wrapped.length * 4;
      const tableStartY = headerTop + 26 + filtersHeight + 6;

      const head = [
        [
          { content: "Sr.\nNo.", rowSpan: 2 },
          { content: "Name of Circle", rowSpan: 2 },
          { content: "Division", rowSpan: 2 },
          { content: "Grid Station", rowSpan: 2 },
          { content: "Feeder Name", rowSpan: 2 },
          { content: "Feeder Code", rowSpan: 2 },
          { content: "Sub-Division", rowSpan: 2 },
          { content: "Permit Number", rowSpan: 2 },
          { content: "Permit Timing", colSpan: 3 },
          { content: "Reason", rowSpan: 2 },
        ],
        ["From", "To", "Duration"],
      ];

      const body = data.items.map((item) => [
        item.sr_no,
        item.circle_name || "-",
        item.division_name || "-",
        item.grid_station || "-",
        item.feeder_name || "-",
        item.feeder_code || "-",
        item.sub_division_name || "-",
        item.permit_number || "-",
        item.permit_from || "-",
        item.permit_to || "-",
        item.duration || "-",
        item.reason || "-",
      ]);

      autoTable(pdf, {
        startY: tableStartY,
        head,
        body,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 1.2,
          valign: "middle",
          halign: "center",
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 20, halign: "left" },
          2: { cellWidth: 20, halign: "left" },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 16 },
          6: { cellWidth: 20, halign: "left" },
          7: { cellWidth: 20 },
          8: { cellWidth: 14 },
          9: { cellWidth: 14 },
          10: { cellWidth: 16 },
          11: { cellWidth: "auto", halign: "left" },
        },
        rowPageBreak: "avoid",
        pageBreak: "auto",
        margin: { left: 8, right: 8 },
      });

      const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, "-").trim();
      const filename = `Emergent-PTW-Report-${safe(data.report_date || "All")}-${data.filters.from_date}-to-${data.filters.to_date}-p${cp}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // -------- Pagination helpers --------
  const currentPage = reportData?.current_page ?? 1;
  const lastPage = reportData?.last_page ?? 1;
  const totalEntries = reportData?.total_entries ?? 0;

  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < lastPage - 2) pages.push("…");
      pages.push(lastPage);
    }
    return pages;
  }, [currentPage, lastPage]);

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="text-lg font-medium">Detail of Emergent PTWs Report</div>
          <div className="text-slate-500 text-sm mt-1">
            Generate the emergent PTW detail report by selecting filters.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reportData && (
            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={onGenerate}
            disabled={!canGenerate || isReportLoading}
          >
            {isReportLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>
      </div>

      {/* Filters Box */}
      <div className="box p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="font-medium">Filters</div>
          {!canGenerate && (
            <div className="text-danger text-xs">Required: From Date ≤ To Date</div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Circle */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Circle
            </label>
            <select
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors disabled:opacity-50"
              name="circle_id"
              value={filters.circle_id}
              onChange={onChange}
              disabled={isCirclesLoading}
            >
              <option value="0">All Circles</option>
              {isCirclesLoading && <option disabled>Loading circles...</option>}
              {circles.map((circle) => (
                <option key={circle.value} value={circle.value}>
                  {circle.label}
                </option>
              ))}
            </select>
          </div>

          {/* Division */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Division
            </label>
            <select
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors disabled:opacity-50"
              name="division_id"
              value={filters.division_id}
              onChange={onChange}
              disabled={!filters.circle_id || isDivisionsLoading}
            >
              <option value="0">All Divisions</option>
              {isDivisionsLoading && <option disabled>Loading divisions...</option>}
              {divisions.map((division) => (
                <option key={division.value} value={division.value}>
                  {division.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Division */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Sub Division
            </label>
            <select
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors disabled:opacity-50"
              name="sub_division_id"
              value={filters.sub_division_id}
              onChange={onChange}
              disabled={!filters.division_id || isSubDivisionsLoading}
            >
              <option value="0">All Sub Divisions</option>
              {isSubDivisionsLoading && <option disabled>Loading sub-divisions...</option>}
              {subDivisions.map((subDivision) => (
                <option key={subDivision.value} value={subDivision.value}>
                  {subDivision.label}
                </option>
              ))}
            </select>
          </div>

          {/* Statuses */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Status
            </label>
            <MultiSelectDropdown
              label="Status"
              options={PTW_STATUS_OPTIONS}
              selected={filters.statuses}
              onChange={onStatusesChange}
              placeholder="All Statuses"
            />
          </div>

          {/* From Date */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              From Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              name="from_date"
              value={filters.from_date}
              onChange={onChange}
            />
          </div>

          {/* To Date */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              To Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              name="to_date"
              value={filters.to_date}
              onChange={onChange}
            />
          </div>

          {/* Per Page */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Rows per page
            </label>
            <select
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <div className="col-span-12 md:col-span-3 flex items-end">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  circle_id: 0,
                  division_id: 0,
                  sub_division_id: 0,
                  statuses: [],
                  from_date: "",
                  to_date: "",
                });
                setPage(1);
              }}
              className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {reportData && (
        <div className="grid grid-cols-12 gap-5 mt-5">
          <div className="col-span-12" ref={reportRef}>
            <div className="box p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                <div className="font-medium">
                  Detail of Emergent PTWs In Respect of MEPCO
                  {reportData.applied_filters?.to
                    ? ` on Date ${reportData.applied_filters.to}`
                    : ""}
                </div>
                <div className="text-slate-500 text-xs">
                  Page {currentPage} of {lastPage} · {totalEntries.toLocaleString()} entries
                </div>
              </div>

              {reportData.detailed_records.length > 0 && (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-200">
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 align-middle">
                          Sr. No.
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">
                          Name of Circle
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">
                          Division
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">
                          Grid Station
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">
                          Feeder Name
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 align-middle">
                          Feeder Code
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">
                          Sub-Division
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 align-middle">
                          Permit Number
                        </th>
                        <th colSpan={3} className="px-3 py-2 text-center text-xs font-semibold text-slate-700 border-b border-slate-200">
                          Permit Timing
                        </th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">
                          Reason
                        </th>
                      </tr>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">From</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">To</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.detailed_records.map((item, index) => (
                        <tr
                          key={`${item.sr_no}-${index}`}
                          className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100`}
                        >
                          <td className="px-3 py-3 text-center font-medium">{item.sr_no}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.circle}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.division}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.grid_station}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.feeder_name}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.feeder_code}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.sub_division}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.permit_number}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.from_time}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.to_time}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.duration}</td>
                          <td className="px-3 py-3">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportData.detailed_records.length === 0 && (
                <div className="alert alert-secondary-soft show mt-5">
                  No data found for the selected filters.
                </div>
              )}

              {/* Pagination — always visible when there are entries */}
              {totalEntries > 0 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Summary */}
                  <div className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {Math.min(
                        (currentPage - 1) * (reportData.per_page ?? perPage) + 1,
                        totalEntries
                      )}
                      –
                      {Math.min(
                        currentPage * (reportData.per_page ?? perPage),
                        totalEntries
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {totalEntries.toLocaleString()}
                    </span>{" "}
                    entries
                    {lastPage > 1 && (
                      <>
                        {" · "}
                        Page{" "}
                        <span className="font-semibold text-slate-700">{currentPage}</span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-700">{lastPage}</span>
                      </>
                    )}
                  </div>

                  {/* Page controls */}
                  {lastPage > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {/* First */}
                      <button
                        type="button"
                        disabled={currentPage <= 1 || isReportLoading}
                        onClick={() => handlePageChange(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="First page"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Prev */}
                      <button
                        type="button"
                        disabled={currentPage <= 1 || isReportLoading}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Numbers */}
                      {pageNumbers.map((p, i) =>
                        p === "…" ? (
                          <span
                            key={`dots-${i}`}
                            className="flex h-8 w-8 items-center justify-center text-xs text-slate-400"
                          >
                            ···
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            disabled={isReportLoading}
                            onClick={() => handlePageChange(p as number)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums transition ${
                              p === currentPage
                                ? "bg-[#0B69DC] text-white shadow"
                                : "text-slate-600 hover:bg-slate-100"
                            } disabled:cursor-not-allowed`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      {/* Next */}
                      <button
                        type="button"
                        disabled={currentPage >= lastPage || isReportLoading}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Last */}
                      <button
                        type="button"
                        disabled={currentPage >= lastPage || isReportLoading}
                        onClick={() => handlePageChange(lastPage)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Last page"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;