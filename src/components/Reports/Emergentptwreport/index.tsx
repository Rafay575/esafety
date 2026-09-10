import React, { useMemo, useState, useEffect, useRef } from "react";
import Button from "@/components/Base/Button";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { api } from "@/lib/axios";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types (adapted to new API response)
// ---------------------------------------------------------------------------

interface OptionItem {
  value: number;
  label: string;
}

// The report item as returned by the API
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

// The full report data
interface EmergentPTWReportData {
  title: string;
  generated_at: string;
  applied_filters: {
    region_id: number | null;
    circle_id: number | null;
    division_id: number | null;
    sub_division_id: number | null;
    from: string;
    to: string;
  };
  total_entries: number;
  detailed_records: EmergentPTWRecord[];
}

// Internal UI item (mapped from API record)
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

const Main = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Hierarchy data states
  const [regions, setRegions] = useState<OptionItem[]>([]);
  const [circles, setCircles] = useState<OptionItem[]>([]);
  const [divisions, setDivisions] = useState<OptionItem[]>([]);
  const [subDivisions, setSubDivisions] = useState<OptionItem[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(false);
  const [isCirclesLoading, setIsCirclesLoading] = useState(false);
  const [isDivisionsLoading, setIsDivisionsLoading] = useState(false);
  const [isSubDivisionsLoading, setIsSubDivisionsLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    region_id: 0,
    circle_id: 0,
    division_id: 0,
    sub_division_id: 0,
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  // Report state
  const [reportData, setReportData] = useState<EmergentPTWReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

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

      const response = await api.get("/api/v1/meta/reports/emergent-ptw", { params });
      const apiData = response.data?.data ?? response.data;
      // Map to internal item shape for UI/PDF
      const mappedItems: EmergentPTWItem[] = apiData.detailed_records.map(
        (rec: EmergentPTWRecord, index: number) => ({
          id: index, // not provided; using index
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
      setReportData({
        ...apiData,
        items: mappedItems,
        total_entries: apiData.total_entries,
        report_date: apiData.applied_filters?.to, // or from date? The title says "on Date", but we'll use "to" for simplicity
      });
    } catch (err: any) {
      console.error("Failed to generate report", err);
      toast.error(err?.response?.data?.message || "Failed to generate report.");
    } finally {
      setIsReportLoading(false);
    }
  };

  // For PDF we need to use reportData with items (already mapped)
  const data = reportData ? {
    ...reportData,
    items: (reportData as any).items as EmergentPTWItem[],
    filters: {
      from_date: reportData.applied_filters.from,
      to_date: reportData.applied_filters.to,
      circle_id: reportData.applied_filters.circle_id ? String(reportData.applied_filters.circle_id) : undefined,
      division_id: reportData.applied_filters.division_id ? String(reportData.applied_filters.division_id) : undefined,
      sub_division_id: reportData.applied_filters.sub_division_id ? String(reportData.applied_filters.sub_division_id) : undefined,
    },
    breadcrumb: undefined,
    report_date: reportData.applied_filters.to, // use to date as report date
  } : null;

  // PDF generation functions (unchanged but adapted to data)
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
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, headerTop + 7, { align: "center" });

      pdf.setFontSize(9);
      pdf.text(
        `Total Entries: ${data.items.length}   |   Date Range: ${data.filters.from_date} to ${data.filters.to_date}`,
        pageWidth / 2,
        headerTop + 13,
        { align: "center" }
      );

      const filterLines: string[] = [];
      if (data.filters.circle_id) filterLines.push(`Circle ID: ${data.filters.circle_id}`);
      if (data.filters.division_id) filterLines.push(`Division ID: ${data.filters.division_id}`);
      if (data.filters.sub_division_id) filterLines.push(`Sub Division ID: ${data.filters.sub_division_id}`);
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
      const filename = `Emergent-PTW-Report-${safe(data.report_date || "All")}-${data.filters.from_date}-to-${data.filters.to_date}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
              {isRegionsLoading && <option disabled>Loading regions...</option>}
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
                  from_date: "",
                  to_date: "",
                });
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
                  {reportData.applied_filters?.to ? ` on Date ${reportData.applied_filters.to}` : ""}
                </div>
                <div className="text-slate-500 text-xs">
                  {reportData.total_entries} entries
                </div>
              </div>

              {reportData.total_entries > 0 && (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-200">
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 align-middle">Sr. No.</th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">Name of Circle</th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">Division</th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">Grid Station</th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">Feeder Name</th>
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 align-middle">Feeder Code</th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">Sub-Division</th>
                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 align-middle">Permit Number</th>
                        <th colSpan={3} className="px-3 py-2 text-center text-xs font-semibold text-slate-700 border-b border-slate-200">Permit Timing</th>
                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-slate-700 align-middle">Reason</th>
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

              {reportData.total_entries === 0 && (
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