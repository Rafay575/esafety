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

interface PTWType {
  code: string;
  label_en: string;
}

interface SummaryByType {
  type: string;
  count: number;
  percentage: number;
}

interface DetailedRecord {
  sr_no: number;
  ptw_reference: string | null;
  type: string;
  circle: string;
  division: string;
  sub_division: string;
  feeder: string;
  issued_at: string;
  duration: string | null;
  status: string;
}

interface PaginationBlock {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

interface ReportData {
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
    types: string[];
  };
  total_ptws: number;
  summary_by_type: SummaryByType[];
  detailed_records: DetailedRecord[];
  pagination?: PaginationBlock;
  // Flat fallbacks
  current_page?: number;
  last_page?: number;
  per_page?: number;
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
// Labelling helpers
// ---------------------------------------------------------------------------

function getStatusLabels(codes: string[] | undefined): string {
  if (!codes || codes.length === 0) return "All Statuses";
  return codes
    .map((code) => PTW_STATUS_OPTIONS.find((s) => s.value === code)?.label ?? code)
    .join(", ");
}

function getTypeLabels(codes: string[] | undefined): string {
  if (!codes || codes.length === 0) return "All Types";
  return codes.join(", ");
}

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
        : `${selected.length} selected`;

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
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const Main = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Hierarchy
  const [circles, setCircles] = useState<OptionItem[]>([]);
  const [divisions, setDivisions] = useState<OptionItem[]>([]);
  const [subDivisions, setSubDivisions] = useState<OptionItem[]>([]);
  const [isCirclesLoading, setIsCirclesLoading] = useState(false);
  const [isDivisionsLoading, setIsDivisionsLoading] = useState(false);
  const [isSubDivisionsLoading, setIsSubDivisionsLoading] = useState(false);

  // PTW types
  const ptwTypes: PTWType[] = [
    { code: "Planned", label_en: "Planned" },
    { code: "Emergency", label_en: "Emergency" },
    { code: "Misc", label_en: "Misc" },
  ];

  // Filters
  const [filters, setFilters] = useState({
    circle_id: 0,
    division_id: 0,
    sub_division_id: 0,
    ptw_types: [] as string[],
    statuses: [] as string[],
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(50);
  const PER_PAGE_OPTIONS = [50, 100, 500, 1000] as const;
  const [hasGenerated, setHasGenerated] = useState(false);

  const selectedCircleId = filters.circle_id > 0 ? filters.circle_id : null;
  const selectedDivisionId = filters.division_id > 0 ? filters.division_id : null;

  // Fetch circles on mount
  useEffect(() => {
    const fetchCircles = async () => {
      setIsCirclesLoading(true);
      try {
        const res = await api.get("/api/v1/meta/circles");
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

  // Fetch divisions
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

  // Fetch sub-divisions
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
      setFilters((prev) => ({
        ...prev,
        circle_id: circleId,
        division_id: 0,
        sub_division_id: 0,
      }));
      setPage(1);
    } else if (name === "division_id") {
      const divisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        division_id: divisionId,
        sub_division_id: 0,
      }));
      setPage(1);
    } else if (name === "sub_division_id") {
      const subDivisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({ ...prev, sub_division_id: subDivisionId }));
      setPage(1);
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
      if (name === "from_date" || name === "to_date") setPage(1);
    }
  };

  const togglePTWType = (code: string) => {
    setFilters((prev) => {
      const exists = prev.ptw_types.includes(code);
      return {
        ...prev,
        ptw_types: exists
          ? prev.ptw_types.filter((c) => c !== code)
          : [...prev.ptw_types, code],
      };
    });
    setPage(1);
  };

  const onStatusesChange = (next: string[]) => {
    setFilters((prev) => ({ ...prev, statuses: next }));
    setPage(1);
  };

  // -------- Query params --------
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
    if (filters.ptw_types.length > 0) params.types = filters.ptw_types;
    if (filters.statuses.length > 0) params.statuses = filters.statuses;
    return params;
  };

  const fetchReport = async (opts?: { pageOverride?: number; perPageOverride?: number }) => {
    setIsReportLoading(true);
    try {
      const params = buildParams(opts);
      const response = await api.get("/api/v1/meta/reports/ptw-type-wise", {
        params,
        // ✅ Produces types[]=Planned&types[]=Emergency (Laravel-friendly)
        paramsSerializer: { indexes: false },
      });
      const apiData = response.data?.data ?? response.data;

      const pag: PaginationBlock | undefined = apiData.pagination;

      const merged: ReportData = {
        ...apiData,
        total_ptws: pag?.total ?? apiData.total_ptws ?? apiData.detailed_records?.length ?? 0,
        current_page: pag?.current_page ?? apiData.current_page ?? opts?.pageOverride ?? page,
        last_page: pag?.last_page ?? apiData.last_page ?? 1,
        per_page: pag?.per_page ?? apiData.per_page ?? opts?.perPageOverride ?? perPage,
      };

      setReportData(merged);
      setHasGenerated(true);
    } catch (err: any) {
      console.error("Failed to generate report", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to generate report. Please check your filters and try again."
      );
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

  // ---------------------------------------------------------------------
  // PDF export
  // ---------------------------------------------------------------------

  const loadPngAsResizedDataURL = async (url: string, targetMaxWidthPx = 220): Promise<string> => {
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
    if (!reportData) {
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
      pdf.text(reportData.title || "PTW Type-wise Report", pageWidth / 2, headerTop + 2, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `Generated: ${reportData.generated_at || new Date().toLocaleString()}`,
        pageWidth / 2,
        headerTop + 7,
        { align: "center" }
      );

      const cp = reportData.current_page ?? 1;
      const lp = reportData.last_page ?? 1;
      pdf.setFontSize(9);
      pdf.text(
        `Page ${cp} of ${lp}   |   Total PTWs: ${reportData.total_ptws}   |   Date Range: ${reportData.applied_filters.from} to ${reportData.applied_filters.to}`,
        pageWidth / 2,
        headerTop + 13,
        { align: "center" }
      );

      const af = reportData.applied_filters;
      const statusLabels =
        af.statuses && af.statuses.length > 0
          ? af.statuses
              .map(
                (code) =>
                  PTW_STATUS_OPTIONS.find((s) => s.value === code)?.label ?? code
              )
              .join(", ")
          : "All Statuses";

      // Prominent "Counting statuses" line
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(`Counting statuses: ${statusLabels}`, pageWidth / 2, headerTop + 18, {
        align: "center",
      });

      // Applied filters block
      const filterLines: string[] = [];
      if (af.types && af.types.length) filterLines.push(`PTW Types: ${af.types.join(", ")}`);
      if (af.circle_id) filterLines.push(`Circle ID: ${af.circle_id}`);
      if (af.division_id) filterLines.push(`Division ID: ${af.division_id}`);
      if (af.sub_division_id) filterLines.push(`Sub Division ID: ${af.sub_division_id}`);
      filterLines.push(`From: ${af.from}`);
      filterLines.push(`To: ${af.to}`);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Applied Filters:", leftX, headerTop + 24);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const filtersText = filterLines.join("   |   ");
      const wrapped = pdf.splitTextToSize(filtersText, usableWidth);
      pdf.text(wrapped, leftX, headerTop + 28);
      let cursorY = headerTop + 32 + wrapped.length * 4 + 6;

      // Summary table
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Summary by PTW Type", leftX, cursorY);
      cursorY += 4;

      autoTable(pdf, {
        startY: cursorY,
        head: [["PTW Type", "Count", "Percentage"]],
        body: [
          ...reportData.summary_by_type.map((row) => [
            row.type,
            row.count.toString(),
            `${row.percentage.toFixed(1)}%`,
          ]),
          ["TOTAL", reportData.total_ptws.toString(), "100%"],
        ],
        theme: "grid",
        styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5, halign: "center" },
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
        columnStyles: { 0: { halign: "left", cellWidth: 60 } },
        margin: { left: leftX, right: 10 },
        tableWidth: 120,
        didParseCell: (hook) => {
          if (hook.row.index === reportData.summary_by_type.length) {
            hook.cell.styles.fillColor = [226, 232, 240];
            hook.cell.styles.fontStyle = "bold";
          }
        },
      });

      // @ts-ignore
      cursorY = (pdf as any).lastAutoTable.finalY + 10;

      // Detailed records
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Detailed Records", leftX, cursorY);
      cursorY += 4;

      const head = [[
        "Sr. No.",
        "PTW Reference",
        "Type",
        "Circle",
        "Division",
        "Sub-Division",
        "Feeder",
        "Issued At",
        "Duration",
        "Status",
      ]];
      const body = reportData.detailed_records.map((item) => [
        item.sr_no,
        item.ptw_reference ?? "—",
        item.type,
        item.circle,
        item.division,
        item.sub_division,
        item.feeder,
        item.issued_at,
        item.duration ?? "—",
        item.status,
      ]);

      autoTable(pdf, {
        startY: cursorY,
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
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 30, halign: "left" },
          2: { cellWidth: 22, halign: "left" },
          3: { cellWidth: 26, halign: "left" },
          4: { cellWidth: 26, halign: "left" },
          5: { cellWidth: 26, halign: "left" },
          6: { cellWidth: 26, halign: "left" },
          7: { cellWidth: 30 },
          8: { cellWidth: 16 },
          9: { cellWidth: "auto" },
        },
        rowPageBreak: "avoid",
        pageBreak: "auto",
        margin: { left: 8, right: 8 },
      });

      const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, "-").trim();
      const filename = `PTW-Type-Report-${safe(af.from)}-to-${safe(af.to)}-p${cp}.pdf`;
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
  const totalEntries = reportData?.total_ptws ?? 0;
  const effectivePerPage = reportData?.per_page ?? perPage;

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
          <div className="text-lg font-medium">PTW Type-wise Report</div>
          <div className="text-slate-500 text-sm mt-1">
            Detailed records and summarized statistics by PTW type.
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
          {!canGenerate && <div className="text-danger text-xs">Required: From Date ≤ To Date</div>}
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
              {subDivisions.map((subDivision) => (
                <option key={subDivision.value} value={subDivision.value}>
                  {subDivision.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
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
                  ptw_types: [],
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

          {/* PTW Type chips */}
          <div className="col-span-12">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              PTW Type
              <span className="text-slate-400 normal-case font-normal ml-2">
                (leave blank for all types)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ptwTypes.map((type) => {
                const active = filters.ptw_types.includes(type.code);
                return (
                  <button
                    key={type.code}
                    type="button"
                    onClick={() => togglePTWType(type.code)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? "bg-slate-700 text-white border-slate-700"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {type.label_en}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {reportData && (
        <div className="mt-5">
          <div className="box p-5">
            {/* Header + Counting banner */}
            <div className="border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Summary by PTW Type</div>
                <div className="text-slate-500 text-xs">
                  Total: {reportData.total_ptws.toLocaleString()}
                </div>
              </div>

              {/* Counting line */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Counting:
                </span>
                <span>
                  <span className="text-slate-500">Types </span>
                  <span className="font-semibold text-slate-700">
                    {getTypeLabels(reportData.applied_filters.types)}
                  </span>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <span className="text-slate-500">Statuses </span>
                  <span className="font-semibold text-slate-700">
                    {getStatusLabels(reportData.applied_filters.statuses)}
                  </span>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <span className="text-slate-500">Period </span>
                  <span className="font-semibold text-slate-700">
                    {reportData.applied_filters.from} → {reportData.applied_filters.to}
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-5">
              {reportData.summary_by_type.map((row) => (
                <div key={row.type} className="col-span-6 md:col-span-3">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="text-slate-500 text-xs">{row.type}</div>
                    <div className="text-xl font-semibold mt-1">{row.count}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {row.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PTW Type</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-700">Count</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.summary_by_type.map((row, index) => (
                  <tr key={row.type} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <td className="px-4 py-2">{row.type}</td>
                    <td className="px-4 py-2 text-center font-semibold">{row.count}</td>
                    <td className="px-4 py-2 text-center">{row.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-2 font-semibold">TOTAL</td>
                  <td className="px-4 py-2 text-center font-bold">
                    {reportData.total_ptws.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Records */}
      {reportData && (
        <div className="grid grid-cols-12 gap-5 mt-5">
          <div className="col-span-12" ref={reportRef}>
            <div className="box p-5">
              <div className="border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Detailed Records</div>
                  <div className="text-slate-500 text-xs">
                    Page {currentPage} of {lastPage} · {totalEntries.toLocaleString()} entries
                  </div>
                </div>

                {reportData.applied_filters.statuses &&
                  reportData.applied_filters.statuses.length > 1 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Filtered by:
                      </span>
                      {reportData.applied_filters.statuses.map((code) => {
                        const label =
                          PTW_STATUS_OPTIONS.find((s) => s.value === code)?.label ??
                          code;
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
              </div>

              {reportData.detailed_records.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-200">
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">Sr. No.</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">PTW Reference</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Circle</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Division</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Sub-Division</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Feeder</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">Issued At</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">Duration</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.detailed_records.map((item) => (
                        <tr
                          key={item.sr_no}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.sr_no}</td>
                          <td className="px-3 py-3 whitespace-nowrap font-medium">
                            {item.ptw_reference ?? "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.circle}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.division}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.sub_division}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.feeder}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.issued_at}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.duration ?? "—"}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-secondary-soft show mt-5">
                  No data found for the selected filters.
                </div>
              )}

              {totalEntries > 0 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {Math.min((currentPage - 1) * effectivePerPage + 1, totalEntries)}–
                      {Math.min(currentPage * effectivePerPage, totalEntries)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {totalEntries.toLocaleString()}
                    </span>{" "}
                    entries
                    {lastPage > 1 && (
                      <>
                        {" · "}
                        Page <span className="font-semibold text-slate-700">{currentPage}</span> of{" "}
                        <span className="font-semibold text-slate-700">{lastPage}</span>
                      </>
                    )}
                  </div>

                  {lastPage > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
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