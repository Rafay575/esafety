import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Button from "@/components/Base/Button";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { api } from "@/lib/axios"; // assumes axios instance

// ---------------------------------------------------------------------------
// Types (adapted to new response)
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
  issued_at: string; // already formatted
  duration: string | null;
  status: string;
}

interface ReportData {
  title: string;
  generated_at: string;
  applied_filters: {
    region_id: number | null;
    circle_id: number | null;
    division_id: number | null;
    sub_division_id: number | null;
    from: string;
    to: string;
    types: string[];
  };
  total_ptws: number;
  summary_by_type: SummaryByType[];
  detailed_records: DetailedRecord[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  // The API already returns formatted date-time, so this may not be needed.
  // But keep it in case we receive ISO in future.
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Main = () => {
  // Report data and loading state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Hierarchy data
  const [regions, setRegions] = useState<OptionItem[]>([]);
  const [circles, setCircles] = useState<OptionItem[]>([]);
  const [divisions, setDivisions] = useState<OptionItem[]>([]);
  const [subDivisions, setSubDivisions] = useState<OptionItem[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(false);
  const [isCirclesLoading, setIsCirclesLoading] = useState(false);
  const [isDivisionsLoading, setIsDivisionsLoading] = useState(false);
  const [isSubDivisionsLoading, setIsSubDivisionsLoading] = useState(false);

  // PTW types (hardcoded for now; could fetch from API if needed)
  const ptwTypes: PTWType[] = [
    { code: "Planned", label_en: "Planned" },
    { code: "Emergency", label_en: "Emergency" },
    { code: "Misc", label_en: "Misc" },
  ];

  // Filter state
  const [filters, setFilters] = useState({
    region_id: 0,
    circle_id: 0,
    division_id: 0,
    sub_division_id: 0,
    ptw_types: [] as string[],
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  // Derived selected IDs for hierarchy fetches
  const selectedRegionId = filters.region_id > 0 ? filters.region_id : null;
  const selectedCircleId = filters.circle_id > 0 ? filters.circle_id : null;
  const selectedDivisionId = filters.division_id > 0 ? filters.division_id : null;

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      setIsRegionsLoading(true);
      try {
        const res = await api.get("/api/v1/meta/regions");
        // Assume response format: { data: [{ id, name }] }
        const data = res.data?.data ?? res.data;
        setRegions(
          Array.isArray(data)
            ? data.map((r: any) => ({ value: r.id, label: r.name }))
            : []
        );
      } catch (err) {
        console.error("Failed to load regions", err);
      } finally {
        setIsRegionsLoading(false);
      }
    };
    fetchRegions();
  }, []);

  // Fetch circles when region changes
  useEffect(() => {
    if (!selectedRegionId) {
      setCircles([]);
      return;
    }
    const fetchCircles = async () => {
      setIsCirclesLoading(true);
      try {
        const res = await api.get(`/api/v1/meta/circles?region_id=${selectedRegionId}`);
        const data = res.data?.data ?? res.data;
        setCircles(
          Array.isArray(data)
            ? data.map((c: any) => ({ value: c.id, label: c.name }))
            : []
        );
      } catch (err) {
        console.error("Failed to load circles", err);
      } finally {
        setIsCirclesLoading(false);
      }
    };
    fetchCircles();
  }, [selectedRegionId]);

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
          Array.isArray(data)
            ? data.map((d: any) => ({ value: d.id, label: d.name }))
            : []
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
          Array.isArray(data)
            ? data.map((sd: any) => ({ value: sd.id, label: sd.name }))
            : []
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

    if (name === "region_id") {
      const regionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        region_id: regionId,
        circle_id: 0,
        division_id: 0,
        sub_division_id: 0,
      }));
    } else if (name === "circle_id") {
      const circleId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        circle_id: circleId,
        division_id: 0,
        sub_division_id: 0,
      }));
    } else if (name === "division_id") {
      const divisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({
        ...prev,
        division_id: divisionId,
        sub_division_id: 0,
      }));
    } else if (name === "sub_division_id") {
      const subDivisionId = value === "0" ? 0 : parseInt(value);
      setFilters((prev) => ({ ...prev, sub_division_id: subDivisionId }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
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
  };

 const onGenerate = async () => {
  if (!canGenerate) return;
  setIsReportLoading(true);
  setReportData(null);
  try {
    const params: any = {
      from: filters.from_date,
      to: filters.to_date,
    };
    if (filters.region_id > 0) params.region_id = filters.region_id;
    if (filters.circle_id > 0) params.circle_id = filters.circle_id;
    if (filters.division_id > 0) params.division_id = filters.division_id;
    if (filters.sub_division_id > 0) params.sub_division_id = filters.sub_division_id;
    // ✅ Send types as an array if any are selected
    if (filters.ptw_types.length > 0) {
      params.types = filters.ptw_types;
    }

    const response = await api.get("/api/v1/meta/reports/ptw-type-wise", { params });
    const data = response.data?.data ?? response.data;
    setReportData(data);
  } catch (err) {
    console.error("Failed to generate report", err);
    alert("Failed to generate report. Please check your filters and try again.");
  } finally {
    setIsReportLoading(false);
  }
};
  // ---------------------------------------------------------------------
  // PDF export (adapted to new data shape)
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

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(reportData.title || "PTW Type-wise Report", pageWidth / 2, headerTop + 2, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Generated: ${reportData.generated_at || new Date().toLocaleString()}`, pageWidth / 2, headerTop + 7, { align: "center" });

      pdf.setFontSize(9);
      pdf.text(
        `Total PTWs: ${reportData.total_ptws}   |   Date Range: ${reportData.applied_filters.from} to ${reportData.applied_filters.to}`,
        pageWidth / 2,
        headerTop + 13,
        { align: "center" }
      );

      // Applied filters
      const filterLines: string[] = [];
      const af = reportData.applied_filters;
      if (af.region_id) filterLines.push(`Region ID: ${af.region_id}`);
      if (af.circle_id) filterLines.push(`Circle ID: ${af.circle_id}`);
      if (af.division_id) filterLines.push(`Division ID: ${af.division_id}`);
      if (af.sub_division_id) filterLines.push(`Sub Division ID: ${af.sub_division_id}`);
      if (af.types && af.types.length) filterLines.push(`PTW Types: ${af.types.join(", ")}`);
      filterLines.push(`From: ${af.from}`);
      filterLines.push(`To: ${af.to}`);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Applied Filters:", leftX, headerTop + 18);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const filtersText = filterLines.join("   |   ");
      const wrapped = pdf.splitTextToSize(filtersText, usableWidth);
      pdf.text(wrapped, leftX, headerTop + 22);
      let cursorY = headerTop + 26 + wrapped.length * 4 + 6;

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

      // Detailed records table
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Detailed Records", leftX, cursorY);
      cursorY += 4;

      const head = [["Sr. No.", "PTW Reference", "Type", "Circle", "Division", "Sub-Division", "Feeder", "Issued At", "Duration", "Status"]];
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
          2: { cellWidth: 30, halign: "left" },
          3: { cellWidth: 30, halign: "left" },
          4: { cellWidth: 30, halign: "left" },
          5: { cellWidth: 30, halign: "left" },
          6: { cellWidth: 30, halign: "left" },
          7: { cellWidth: 32 },
          8: { cellWidth: 16 },
          9: { cellWidth: "auto" },
        },
        rowPageBreak: "avoid",
        pageBreak: "auto",
        margin: { left: 8, right: 8 },
      });

      const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, "-").trim();
      const filename = `PTW-Type-Report-${safe(af.from)}-to-${safe(af.to)}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
              disabled={isRegionsLoading}
            >
              <option value="0">All Regions</option>
              {regions.map((region) => (
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
              disabled={!filters.region_id || isCirclesLoading}
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
                  ptw_types: [],
                  from_date: "",
                  to_date: "",
                });
              }}
              className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* PTW Type multi-select (chips) */}
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

      {/* Summary Statistics */}
      {reportData && (
        <div className="mt-5">
          <div className="box p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="font-medium">Summary by PTW Type</div>
              <div className="text-slate-500 text-xs">Total: {reportData.total_ptws}</div>
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
                  <td className="px-4 py-2 text-center font-bold">{reportData.total_ptws}</td>
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
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                <div className="font-medium">Detailed Records</div>
                <div className="text-slate-500 text-xs">
                  {reportData.detailed_records.length} entries
                </div>
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
                          <td className="px-3 py-3 whitespace-nowrap font-medium">{item.ptw_reference ?? "—"}</td>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;