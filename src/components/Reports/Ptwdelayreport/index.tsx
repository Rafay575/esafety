import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  usePTWDelayReport,
  useRegions,
  useCircles,
  useDivisions,
  useSubDivisions,
  useDelayStatuses,
} from "./hooks";
import Button from "@/components/Base/Button";
import autoTable from "jspdf-autotable";
// Install these packages first:
// npm install jspdf html2canvas jspdf-autotable
import jsPDF from "jspdf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OptionItem {
  value: number;
  label: string;
}

export interface DelayStatus {
  code: string;
  label_en: string;
}

// One row of the PTW Delay / User Response report.
export interface PTWDelayItem {
  id: number;
  ptw_reference: string;
  circle_name: string;
  division_name: string;
  sub_division_name: string;
  user_name: string;
  role: string;
  assigned_at: string; // ISO datetime string
  responded_at: string | null; // ISO datetime string, null if still pending
  response_minutes: number | null; // actual time taken, null if still pending
  sla_minutes: number; // expected/allowed time
  delay_minutes: number; // max(0, response_minutes - sla_minutes); ongoing delay if still pending
  is_delayed: boolean;
  status: string; // current PTW status, e.g. "Pending", "Approved", "Closed"
}

export interface PTWDelayReportData {
  filters: {
    circle_id?: string | null;
    division_id?: string | null;
    sub_division_id?: string | null;
    status?: string | null;
    delayed_only?: boolean;
    from_date: string;
    to_date: string;
  };
  breadcrumb?: {
    circle?: { name: string; code: string };
    division?: { name: string; code: string };
    sub_division?: { name: string; code: string };
  };
  total_count: number;
  delayed_count: number;
  avg_delay_minutes: number;
  items: PTWDelayItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutes(mins: number | null): string {
  if (mins === null || mins === undefined) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const Main = () => {
  const report = usePTWDelayReport();
  const statusesQuery = useDelayStatuses();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Hierarchy queries
  const regionsQuery = useRegions();
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null,
  );

  const circlesQuery = useCircles(selectedRegionId);
  const divisionsQuery = useDivisions(selectedCircleId);
  const subDivisionsQuery = useSubDivisions(selectedDivisionId);

  const [filters, setFilters] = useState({
    region_id: 0,
    circle_id: 0,
    division_id: 0,
    sub_division_id: 0,
    status: "",
    delayed_only: false,
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  useEffect(() => {
    if (filters.region_id === 0) {
      setSelectedRegionId(null);
      setSelectedCircleId(null);
      setSelectedDivisionId(null);
      setFilters((prev) => ({
        ...prev,
        circle_id: 0,
        division_id: 0,
        sub_division_id: 0,
      }));
    } else {
      setSelectedRegionId(filters.region_id);
    }
  }, [filters.region_id]);

  useEffect(() => {
    if (filters.circle_id === 0) {
      setSelectedCircleId(null);
      setSelectedDivisionId(null);
      setFilters((prev) => ({
        ...prev,
        division_id: 0,
        sub_division_id: 0,
      }));
    } else {
      setSelectedCircleId(filters.circle_id);
    }
  }, [filters.circle_id]);

  useEffect(() => {
    if (filters.division_id === 0) {
      setSelectedDivisionId(null);
      setFilters((prev) => ({ ...prev, sub_division_id: 0 }));
    } else {
      setSelectedDivisionId(filters.division_id);
    }
  }, [filters.division_id]);

  const canGenerate = useMemo(() => {
    if (!filters.from_date || !filters.to_date) return false;
    if (filters.from_date > filters.to_date) return false;
    return true;
  }, [filters]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (name === "region_id") {
      const regionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        [name]: regionId,
        circle_id: 0,
        division_id: 0,
        sub_division_id: 0,
      }));
    } else if (name === "circle_id") {
      const circleId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        [name]: circleId,
        division_id: 0,
        sub_division_id: 0,
      }));
    } else if (name === "division_id") {
      const divisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        [name]: divisionId,
        sub_division_id: 0,
      }));
    } else if (name === "sub_division_id") {
      const subDivisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({ ...prev, [name]: subDivisionId }));
    } else if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onGenerate = () => {
    if (!canGenerate) return;

    const params = {
      region_id:
        filters.region_id > 0 ? filters.region_id.toString() : undefined,
      circle_id:
        filters.circle_id > 0 ? filters.circle_id.toString() : undefined,
      division_id:
        filters.division_id > 0 ? filters.division_id.toString() : undefined,
      sub_division_id:
        filters.sub_division_id > 0
          ? filters.sub_division_id.toString()
          : undefined,
      status: filters.status || undefined,
      delayed_only: filters.delayed_only || undefined,
      from_date: filters.from_date,
      to_date: filters.to_date,
    };

    report.mutate(params);
  };

  // ---------------------------------------------------------------------
  // PDF export
  // ---------------------------------------------------------------------

  const loadPngAsResizedDataURL = async (
    url: string,
    targetMaxWidthPx = 220,
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
    if (!data) {
      alert("No report data available to download.");
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
      pdf.text("PTW Delay / User Response Report", pageWidth / 2, headerTop + 2, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        headerTop + 7,
        { align: "center" },
      );

      pdf.setFontSize(9);
      pdf.text(
        `Total: ${data.total_count}   |   Delayed: ${data.delayed_count}   |   Avg Delay: ${formatMinutes(
          data.avg_delay_minutes,
        )}   |   Date Range: ${data.filters.from_date} to ${data.filters.to_date}`,
        pageWidth / 2,
        headerTop + 13,
        { align: "center" },
      );

      const filterLines: string[] = [];
      if (data.breadcrumb?.circle) {
        filterLines.push(
          `Circle: ${data.breadcrumb.circle.name} (${data.breadcrumb.circle.code})`,
        );
      }
      if (data.breadcrumb?.division) {
        filterLines.push(
          `Division: ${data.breadcrumb.division.name} (${data.breadcrumb.division.code})`,
        );
      }
      if (data.breadcrumb?.sub_division) {
        filterLines.push(
          `Sub Division: ${data.breadcrumb.sub_division.name} (${data.breadcrumb.sub_division.code})`,
        );
      }
      if (data.filters.status) {
        filterLines.push(`Status: ${data.filters.status}`);
      }
      if (data.filters.delayed_only) {
        filterLines.push(`Delayed Only: Yes`);
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
          "Sr. No.",
          "PTW Reference",
          "Circle",
          "Division",
          "Sub-Division",
          "User",
          "Role",
          "Assigned At",
          "Responded At",
          "Response Time",
          "SLA",
          "Delay",
          "Status",
        ],
      ];

      const body = data.items.map((item:any, idx:number) => [
        idx + 1,
        item.ptw_reference,
        item.circle_name || "-",
        item.division_name || "-",
        item.sub_division_name || "-",
        item.user_name,
        item.role,
        formatDateTime(item.assigned_at),
        formatDateTime(item.responded_at),
        formatMinutes(item.response_minutes),
        formatMinutes(item.sla_minutes),
        item.is_delayed ? formatMinutes(item.delay_minutes) : "-",
        item.status,
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

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 22, halign: "left" },
          2: { cellWidth: 18, halign: "left" },
          3: { cellWidth: 20, halign: "left" },
          4: { cellWidth: 20, halign: "left" },
          5: { cellWidth: 20, halign: "left" },
          6: { cellWidth: 16 },
          7: { cellWidth: 22 },
          8: { cellWidth: 22 },
          9: { cellWidth: 16 },
          10: { cellWidth: 14 },
          11: { cellWidth: 14 },
          12: { cellWidth: "auto" },
        },

        rowPageBreak: "avoid",
        pageBreak: "auto",
        margin: { left: 8, right: 8 },

        didParseCell: (hook) => {
          if (hook.section === "body") {
            const item = data.items[hook.row.index];
            if (item?.is_delayed && hook.column.index === 11) {
              hook.cell.styles.textColor = [185, 28, 28];
              hook.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, "-").trim();
      const filename = `PTW-Delay-Report-${safe(
        data.breadcrumb?.circle?.name || "All",
      )}-${data.filters.from_date}-to-${data.filters.to_date}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const data = report.data?.data;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="text-lg font-medium">
            PTW Delay / User Response Report
          </div>
          <div className="text-slate-500 text-sm mt-1">
            Identify delays in user responses/actions during the PTW workflow.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report.isSuccess && (
            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || !data}
              className="flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
            disabled={!canGenerate || report.isPending}
          >
            {report.isPending ? (
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
            <div className="text-danger text-xs">
              Required: From Date ≤ To Date
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Region */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Region
            </label>
            <select
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              name="region_id"
              value={filters.region_id}
              onChange={onChange}
              disabled={regionsQuery.isLoading}
            >
              <option value="0">All Regions</option>
              {regionsQuery.data?.map((region: OptionItem) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

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
              disabled={!filters.region_id || circlesQuery.isLoading}
            >
              <option value="0">All Circles</option>
              {circlesQuery.data?.map((circle: OptionItem) => (
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
              disabled={!filters.circle_id || divisionsQuery.isLoading}
            >
              <option value="0">All Divisions</option>
              {divisionsQuery.data?.map((division: OptionItem) => (
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
              disabled={!filters.division_id || subDivisionsQuery.isLoading}
            >
              <option value="0">All Sub Divisions</option>
              {subDivisionsQuery.data?.map((subDivision: OptionItem) => (
                <option key={subDivision.value} value={subDivision.value}>
                  {subDivision.label}
                </option>
              ))}
            </select>
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

          {/* Status */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
              Status
            </label>
            <select
              className="w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              name="status"
              value={filters.status}
              onChange={onChange}
              disabled={statusesQuery.isLoading}
            >
              <option value="">All Statuses</option>
              {statusesQuery.data?.map((status: DelayStatus) => (
                <option key={status.code} value={status.code}>
                  {status.label_en}
                </option>
              ))}
            </select>
          </div>

          {/* Delayed Only toggle */}
          <div className="col-span-12 md:col-span-3 flex items-end">
            <label className="flex items-center gap-2 h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full cursor-pointer">
              <input
                type="checkbox"
                name="delayed_only"
                checked={filters.delayed_only}
                onChange={onChange}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Delayed Only
              </span>
            </label>
          </div>

          {/* Reset */}
          <div className="col-span-12 md:col-span-3 flex items-end">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  region_id: 0,
                  circle_id: 0,
                  division_id: 0,
                  sub_division_id: 0,
                  status: "",
                  delayed_only: false,
                  from_date: "",
                  to_date: "",
                });
                setSelectedRegionId(null);
                setSelectedCircleId(null);
                setSelectedDivisionId(null);
              }}
              className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {report.isSuccess && data && (
        <div className="grid grid-cols-12 gap-4 mt-5">
          <div className="col-span-12 md:col-span-4">
            <div className="box p-4">
              <div className="text-slate-500 text-xs">Total Actions</div>
              <div className="text-xl font-semibold mt-1">
                {data.total_count}
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="box p-4">
              <div className="text-slate-500 text-xs">Delayed Actions</div>
              <div className="text-xl font-semibold mt-1 text-red-600">
                {data.delayed_count}
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="box p-4">
              <div className="text-slate-500 text-xs">Average Delay</div>
              <div className="text-xl font-semibold mt-1">
                {formatMinutes(data.avg_delay_minutes)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12" ref={reportRef}>
          <div className="box p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="font-medium">User Response / Delay Breakdown</div>
              {report.isSuccess && (
                <div className="text-slate-500 text-xs">
                  {data?.items.length ?? 0} entries
                </div>
              )}
            </div>

            {report.isSuccess && (data?.items?.length ?? 0) > 0 && (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-200">
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        Sr. No.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                        PTW Reference
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                        Circle / Division / Sub-Div
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                        User / Role
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        Assigned At
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        Responded At
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        Response Time
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        SLA
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        Delay
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items.map((item:any, index:number) => (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${
                          item.is_delayed
                            ? "bg-red-50"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50"
                        } hover:bg-slate-100`}
                      >
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap font-medium">
                          {item.ptw_reference}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs text-slate-600">
                            {item.circle_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.division_name} / {item.sub_division_name}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div>{item.user_name}</div>
                          <div className="text-xs text-slate-400">
                            {item.role}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {formatDateTime(item.assigned_at)}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {formatDateTime(item.responded_at)}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {formatMinutes(item.response_minutes)}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {formatMinutes(item.sla_minutes)}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.is_delayed ? (
                            <span className="font-semibold text-red-600">
                              {formatMinutes(item.delay_minutes)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {report.isSuccess && (data?.items?.length ?? 0) === 0 && (
              <div className="alert alert-secondary-soft show mt-5">
                No data found for the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
