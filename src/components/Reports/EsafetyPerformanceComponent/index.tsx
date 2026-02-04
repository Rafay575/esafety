import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  useESafetyReportCount,
  useESafetyStatuses,
  useRegions,
  useCircles,
  useDivisions,
  useSubDivisions,
} from "./hooks";
import Button from "@/components/Base/Button";
import { BreakdownItem, ESafetyReportCountData, StatusCount } from "./types";
import autoTable from "jspdf-autotable"; 
// Install these packages first:
// npm install jspdf html2canvas
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Main = () => {
  const report = useESafetyReportCount();
  const statusesQuery = useESafetyStatuses();
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
    from_date: "2026-01-01",
    to_date: "2026-02-04",
  });

  // Reset child selections when parent changes
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
    const { name, value } = e.target;

    // Handle hierarchy resets
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
    } else if (name === "status") {
      setFilters((prev) => ({ ...prev, [name]: value }));
    } else {
      // Handle date inputs
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onGenerate = () => {
    if (!canGenerate) return;

    // Prepare params - convert 0 values to empty strings for API
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
      from_date: filters.from_date,
      to_date: filters.to_date,
    };

    report.mutate(params);
  };


const loadImageAsDataURL = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load image: ${url}`);
  const blob = await res.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


const handleDownloadPDF = async () => {
  if (!data) {
    alert("No report data available to download.");
    return;
  }

  setIsGeneratingPDF(true);

  try {
    // ✅ landscape A4
    const pdf = new jsPDF("l", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // ✅ load logo
    let logoDataUrl: string | null = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/logo.png");
    } catch (e) {
      console.warn("Logo load failed, continuing without logo.", e);
    }

    // --- header layout ---
    const headerTop = 10;

    // ✅ Draw logo top-left
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", 10, headerTop - 4, 22, 22);
    }

    // ✅ reserve space for logo on the left so filters won't overlap
    const hasLogo = !!logoDataUrl;
    const logoW = hasLogo ? 22 : 0;
    const logoX = 10;
    const logoGap = hasLogo ? 6 : 0;

    const leftX = hasLogo ? logoX + logoW + logoGap : 10;
    const usableWidth = pageWidth - leftX - 10; // right margin 10

    // ✅ Title centered
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("PTW Performance Report", pageWidth / 2, headerTop + 2, {
      align: "center",
    });

    // ✅ Generated line centered
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, headerTop + 7, {
      align: "center",
    });

    // ✅ Total + Date Range centered
    pdf.setFontSize(9);
    pdf.text(
      `Total PTW Count: ${data.total_ptw_count}   |   Date Range: ${data.filters.from_date} to ${data.filters.to_date}`,
      pageWidth / 2,
      headerTop + 13,
      { align: "center" }
    );

    // ✅ Applied Filters block (left, after logo space)
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
    if (data.filters.status && data.filters.status !== "null") {
      filterLines.push(`Status: ${data.filters.status}`);
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

    // ✅ table start after filters (no overlap)
    const filtersHeight = wrapped.length * 4; // each line ~4mm
    const tableStartY = headerTop + 26 + filtersHeight + 6;

    // ✅ status columns once
    const statusCols = getAllStatusColumns(data.breakdown);

    // --- Table head/body ---
    const head = [
      [
        data.breakdown_type === "circles"
          ? "Circle"
          : data.breakdown_type === "divisions"
            ? "Division"
            : "Sub Division",
        "Total",
        ...statusCols.map((s) =>
          s.short_label_en.replace(/_/g, " ").toUpperCase(),
        ),
      ],
    ];

    const body = data.breakdown.map((item) => {
      const row: (string | number)[] = [];
      row.push(`${item.code} - ${item.name}`);
      row.push(item.total_ptw_count);

      statusCols.forEach((status) => {
        const found = item.statuses.find((x) => x.code === status.code);
        row.push(found?.count ? found.count : "-");
      });

      return row;
    });

    // Totals row
    const totalsRow: (string | number)[] = ["TOTAL", data.total_ptw_count];
    statusCols.forEach((status) => {
      const total = data.breakdown.reduce((sum, item) => {
        const found = item.statuses.find((x) => x.code === status.code);
        return sum + (found?.count || 0);
      }, 0);
      totalsRow.push(total > 0 ? total : "-");
    });
    body.push(totalsRow);

    // ✅ AutoTable (center align except name column, gray header, no row splitting)
    autoTable(pdf, {
      startY: tableStartY,
      head,
      body,
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 7,       // ✅ smaller font
        cellPadding: 1.2,
        valign: "middle",
        halign: "center",  // ✅ center by default
        lineWidth: 0.1,
      },

      headStyles: {
        fillColor: [71, 85, 105], // ✅ gray header
        textColor: 255,           // ✅ white text
        fontStyle: "bold",
        halign: "center",
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },

      columnStyles: {
        0: {
          halign: "left",        // ✅ name column left
          cellWidth: 45,         // ✅ smaller first column
          overflow: "linebreak",
        },
        1: {
          halign: "center",
          cellWidth: 12,
          fontStyle: "bold",
        },
      },

      rowPageBreak: "avoid", // ✅ don't split rows across pages
      pageBreak: "auto",

      margin: { left: 8, right: 8 },

      didParseCell: (hook) => {
        const isTotalRow = hook.row.index === body.length - 1;
        if (isTotalRow) {
          hook.cell.styles.fillColor = [226, 232, 240];
          hook.cell.styles.fontStyle = "bold";
          hook.cell.styles.textColor = [15, 23, 42];
        }
      },
    });

    // ✅ safe filename
    const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, "-").trim();
    const filename = `PTW-Report-${safe(data.breadcrumb?.circle?.name || "All")}-${safe(
      data.breadcrumb?.division?.name || "All",
    )}-${data.filters.from_date}-to-${data.filters.to_date}.pdf`;

    pdf.save(filename);
  } catch (err) {
    console.error(err);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setIsGeneratingPDF(false);
  }
};

  const getBreakdownTitle = (
    data: ESafetyReportCountData | undefined,
  ): string => {
    if (!data) return "Breakdown";

    switch (data.breakdown_type) {
      case "circles":
        return "Circle-wise PTW Count";
      case "divisions":
        return "Division-wise PTW Count";
      case "sub_divisions":
        return "Sub Division-wise PTW Count";
      case "status_only":
        return "Status-wise PTW Count";
      default:
        return "Breakdown";
    }
  };

  const getAllStatusColumns = (breakdown: BreakdownItem[]): StatusCount[] => {
    const statusMap = new Map<string, StatusCount>();

    breakdown.forEach((item) => {
      item.statuses.forEach((status) => {
        if (!statusMap.has(status.code)) {
          // Format the short label: remove underscores and convert to uppercase
          const formattedStatus = {
            ...status,
            short_label_en: status.short_label_en.replace(/_/g, ' ').toUpperCase(),
            count: 0,
          };
          statusMap.set(status.code, formattedStatus);
        }
      });
    });

    // Sort statuses alphabetically by the formatted short label
    return Array.from(statusMap.values()).sort((a, b) =>
      a.short_label_en.localeCompare(b.short_label_en),
    );
  };

  const data = report.data?.data;
  const breadcrumb = data?.breadcrumb;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="text-lg font-medium">Performance Report</div>
          <div className="text-slate-500 text-sm mt-1">
            Generate PTW count report by selecting filters.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PDF Download Button - only show when report is generated */}
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
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      R
                    </span>
                  </div>
                  Region
                </div>
              </label>
              <div className="relative">
                <div className="absolute inset-0 border border-slate-200 dark:border-slate-700 rounded-lg pointer-events-none transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600"></div>
                <select
                  className="relative w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none appearance-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                  name="region_id"
                  value={filters.region_id}
                  onChange={onChange}
                  disabled={regionsQuery.isLoading}
                >
                  <option
                    value="0"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    All Regions
                  </option>
                  {regionsQuery.isLoading && (
                    <option disabled>Loading regions...</option>
                  )}
                  {regionsQuery.data?.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {regionsQuery.isLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">
                    Loading regions...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Circle */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      C
                    </span>
                  </div>
                  Circle
                  {!filters.region_id && (
                    <span className="text-xs font-normal text-amber-600 ml-auto">
                      (Select Region)
                    </span>
                  )}
                </div>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-0 border rounded-lg pointer-events-none transition-colors ${
                    !filters.region_id
                      ? "border-slate-150 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30"
                      : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                  }`}
                ></div>
                <select
                  className={`relative w-full text-sm font-medium focus:outline-none appearance-none px-3 py-2.5 pr-8 rounded-lg border transition-colors ${
                    filters.region_id
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
                      : "bg-slate-50/30 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-slate-150 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                  name="circle_id"
                  value={filters.circle_id}
                  onChange={onChange}
                  disabled={!filters.region_id || circlesQuery.isLoading}
                >
                  <option
                    value="0"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    All Circles
                  </option>
                  {circlesQuery.isLoading && (
                    <option disabled>Loading circles...</option>
                  )}
                  {circlesQuery.data?.map((circle) => (
                    <option key={circle.value} value={circle.value}>
                      {circle.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className={`w-3 h-3 ${
                        filters.region_id
                          ? "text-slate-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {circlesQuery.isLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">
                    Loading circles...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Division */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      D
                    </span>
                  </div>
                  Division
                  {!filters.circle_id && (
                    <span className="text-xs font-normal text-amber-600 ml-auto">
                      (Select Circle)
                    </span>
                  )}
                </div>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-0 border rounded-lg pointer-events-none transition-colors ${
                    !filters.circle_id
                      ? "border-slate-150 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30"
                      : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                  }`}
                ></div>
                <select
                  className={`relative w-full text-sm font-medium focus:outline-none appearance-none px-3 py-2.5 pr-8 rounded-lg border transition-colors ${
                    filters.circle_id
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
                      : "bg-slate-50/30 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-slate-150 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                  name="division_id"
                  value={filters.division_id}
                  onChange={onChange}
                  disabled={!filters.circle_id || divisionsQuery.isLoading}
                >
                  <option
                    value="0"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    All Divisions
                  </option>
                  {divisionsQuery.isLoading && (
                    <option disabled>Loading divisions...</option>
                  )}
                  {divisionsQuery.data?.map((division) => (
                    <option key={division.value} value={division.value}>
                      {division.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className={`w-3 h-3 ${
                        filters.circle_id
                          ? "text-slate-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {divisionsQuery.isLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">
                    Loading divisions...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sub Division */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      S
                    </span>
                  </div>
                  Sub Division
                  {!filters.division_id && (
                    <span className="text-xs font-normal text-amber-600 ml-auto">
                      (Select Division)
                    </span>
                  )}
                </div>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-0 border rounded-lg pointer-events-none transition-colors ${
                    !filters.division_id
                      ? "border-slate-150 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30"
                      : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                  }`}
                ></div>
                <select
                  className={`relative w-full text-sm font-medium focus:outline-none appearance-none px-3 py-2.5 pr-8 rounded-lg border transition-colors ${
                    filters.division_id
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500"
                      : "bg-slate-50/30 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-slate-150 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                  name="sub_division_id"
                  value={filters.sub_division_id}
                  onChange={onChange}
                  disabled={!filters.division_id || subDivisionsQuery.isLoading}
                >
                  <option
                    value="0"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    All Sub Divisions
                  </option>
                  {subDivisionsQuery.isLoading && (
                    <option disabled>Loading sub-divisions...</option>
                  )}
                  {subDivisionsQuery.data?.map((subDivision) => (
                    <option key={subDivision.value} value={subDivision.value}>
                      {subDivision.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className={`w-3 h-3 ${
                        filters.division_id
                          ? "text-slate-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {subDivisionsQuery.isLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">
                    Loading sub-divisions...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* From Date */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-600 dark:text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  From Date <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <div className="relative group">
                <div className="absolute inset-0 border border-slate-200 dark:border-slate-700 rounded-lg pointer-events-none transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600"></div>
                <input
                  type="date"
                  className="relative w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                  name="from_date"
                  value={filters.from_date}
                  onChange={onChange}
                />
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* To Date */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-600 dark:text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  To Date <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <div className="relative group">
                <div className="absolute inset-0 border border-slate-200 dark:border-slate-700 rounded-lg pointer-events-none transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600"></div>
                <input
                  type="date"
                  className="relative w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                  name="to_date"
                  value={filters.to_date}
                  onChange={onChange}
                />
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative">
              <label className="block mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-600 dark:text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Status
                </div>
              </label>
              <div className="relative">
                <div className="absolute inset-0 border border-slate-200 dark:border-slate-700 rounded-lg pointer-events-none transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600"></div>
                <select
                  className="relative w-full bg-white dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none appearance-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                  name="status"
                  value={filters.status}
                  onChange={onChange}
                  disabled={statusesQuery.isLoading}
                >
                  <option
                    value=""
                    className="text-slate-500 dark:text-slate-400"
                  >
                    All Statuses
                  </option>
                  {statusesQuery.isLoading && (
                    <option disabled>Loading statuses...</option>
                  )}
                  {statusesQuery.data?.data.map((status) => (
                    <option key={status.id} value={status.code}>
                      {status.label_en}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {statusesQuery.isLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">
                    Loading statuses...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <div className="col-span-12 md:col-span-3">
            <div className="relative pt-6">
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    region_id: 0,
                    circle_id: 0,
                    division_id: 0,
                    sub_division_id: 0,
                    status: "",
                    from_date: "",
                    to_date: "",
                  });
                  setSelectedRegionId(null);
                  setSelectedCircleId(null);
                  setSelectedDivisionId(null);
                }}
                className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 active:bg-slate-100 dark:active:bg-slate-600 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <svg
                  className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Filters Chips */}
      {(filters.region_id > 0 ||
        filters.circle_id > 0 ||
        filters.division_id > 0 ||
        filters.sub_division_id > 0 ||
        filters.status) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.region_id > 0 && (
            <Chip
              label={`Region: ${regionsQuery.data?.find((r) => r.value === filters.region_id)?.label || filters.region_id}`}
              onRemove={() =>
                setFilters((prev) => ({
                  ...prev,
                  region_id: 0,
                  circle_id: 0,
                  division_id: 0,
                  sub_division_id: 0,
                }))
              }
            />
          )}

          {filters.circle_id > 0 && (
            <Chip
              label={`Circle: ${circlesQuery.data?.find((c) => c.value === filters.circle_id)?.label || filters.circle_id}`}
              onRemove={() =>
                setFilters((prev) => ({
                  ...prev,
                  circle_id: 0,
                  division_id: 0,
                  sub_division_id: 0,
                }))
              }
            />
          )}

          {filters.division_id > 0 && (
            <Chip
              label={`Division: ${divisionsQuery.data?.find((d) => d.value === filters.division_id)?.label || filters.division_id}`}
              onRemove={() =>
                setFilters((prev) => ({
                  ...prev,
                  division_id: 0,
                  sub_division_id: 0,
                }))
              }
            />
          )}

          {filters.sub_division_id > 0 && (
            <Chip
              label={`Sub Division: ${subDivisionsQuery.data?.find((s) => s.value === filters.sub_division_id)?.label || filters.sub_division_id}`}
              onRemove={() =>
                setFilters((prev) => ({ ...prev, sub_division_id: 0 }))
              }
            />
          )}

          {filters.status && (
            <Chip
              label={`Status: ${statusesQuery.data?.data.find((s) => s.code === filters.status)?.label_en || filters.status}`}
              onRemove={() => setFilters((prev) => ({ ...prev, status: "" }))}
            />
          )}
        </div>
      )}

      {/* Result */}
      <div className="grid grid-cols-12 gap-5 mt-5">
        {/* Count Card */}
      

        {/* Breadcrumb + Filters Summary */}
        <div className="col-span-12" ref={reportRef}>
          <div className="box p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="font-medium">Report Details</div>
              {report.isSuccess && (
                <div className="text-slate-500 text-xs">
                  Showing:{" "}
                  {data?.breakdown_type === "divisions"
                    ? "Divisions"
                    : data?.breakdown_type === "sub_divisions"
                      ? "Sub Divisions"
                      : "Status Breakdown"}
                </div>
              )}
            </div>

            {/* Breadcrumb */}
            {report.isSuccess && data?.breadcrumb && (
              <div className="grid grid-cols-12 gap-4 mb-5">
                {data.breadcrumb.circle && (
                  <InfoCard
                    className="col-span-12 md:col-span-4"
                    title="Circle"
                    value={`${data.breadcrumb.circle.name} (${data.breadcrumb.circle.code})`}
                  />
                )}
                {data.breadcrumb.division && (
                  <InfoCard
                    className="col-span-12 md:col-span-4"
                    title="Division"
                    value={`${data.breadcrumb.division.name} (${data.breadcrumb.division.code})`}
                  />
                )}
                {data.breadcrumb.sub_division && (
                  <InfoCard
                    className="col-span-12 md:col-span-4"
                    title="Sub Division"
                    value={`${data.breadcrumb.sub_division.name} (${data.breadcrumb.sub_division.code})`}
                  />
                )}
              </div>
            )}

            {/* Filters summary */}
            {report.isSuccess && (
              <div className="mb-5">
                <div className="text-slate-500 text-xs mb-2">
                  Applied Filters
                </div>
                <div className="flex flex-wrap gap-2">
                  {data?.filters?.circle_id &&
                    data.filters.circle_id !== "null" && (
                      <Chip
                        label={`Circle: ${data.breadcrumb?.circle?.name || data.filters.circle_id}`}
                      />
                    )}
                  {data?.filters?.division_id &&
                    data.filters.division_id !== "null" && (
                      <Chip
                        label={`Division: ${data.breadcrumb?.division?.name || data.filters.division_id}`}
                      />
                    )}
                  {data?.filters?.sub_division_id &&
                    data.filters.sub_division_id !== "null" && (
                      <Chip
                        label={`Sub Division: ${data.breadcrumb?.sub_division?.name || data.filters.sub_division_id}`}
                      />
                    )}
                  {data?.filters?.status && data.filters.status !== "null" && (
                    <Chip label={`Status: ${data.filters.status}`} />
                  )}
                  <Chip label={`From: ${data?.filters?.from_date ?? "-"}`} />
                  <Chip label={`To: ${data?.filters?.to_date ?? "-"}`} />
                </div>
              </div>
            )}

            {/* Breakdown Table */}
            {report.isSuccess && (data?.breakdown?.length ?? 0) > 0 && (
              <div className="mt-6">
                <div className="font-medium mb-4">
                  {getBreakdownTitle(data)}
                </div>
                <div className="overflow-auto">
                  {/* Table for divisions or sub-divisions with status columns */}
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                          {data?.breakdown_type==="circles"? "Circle" : data?.breakdown_type === "divisions"
                            ? "Division"
                            : "Sub Division"}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                          Total
                        </th>
                        {data
                          ? getAllStatusColumns(data.breakdown).map(
                              (status) => (
                                <th
                                  key={status.code}
                                  className="px-4 py-3 text-center text-xs font-semibold text-slate-700"
                                  title={status.label_en}
                                >
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs">
                                      {status.short_label_en}
                                    </span>
                                  </div>
                                </th>
                              ),
                            )
                          : " - "}
                      </tr>
                    </thead>
                    <tbody>
                      {data?.breakdown.map((item, index) => (
                        <tr 
                          key={item.id} 
                          className={`
                            border-b border-slate-100 
                            ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                            hover:bg-slate-100
                          `}
                        >
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {item.code} - {item.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold text-center">
                            {item.total_ptw_count}
                          </td>
                          {getAllStatusColumns(data.breakdown).map(
                            (status) => {
                              const statusItem = item.statuses.find(
                                (s) => s.code === status.code,
                              );
                              const count = statusItem?.count || 0;
                              return (
                                <td
                                  key={status.code}
                                  className="px-4 py-3 whitespace-nowrap text-center"
                                >
                                  {count > 0 ? (
                                    <div>{count}</div>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            },
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals row */}
                    <tfoot className="border-t border-slate-200">
                      <tr className="bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold">
                          TOTAL
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-center">
                          {data?.total_ptw_count}
                        </td>
                        {data
                          ? getAllStatusColumns(data.breakdown).map(
                              (status) => {
                                const total = data.breakdown.reduce(
                                  (sum, item) => {
                                    const statusItem = item.statuses.find(
                                      (s) => s.code === status.code,
                                    );
                                    return sum + (statusItem?.count || 0);
                                  },
                                  0,
                                );
                                return (
                                  <td
                                    key={status.code}
                                    className="px-4 py-3 text-sm font-semibold text-center"
                                  >
                                    {total > 0 ? total : "-"}
                                  </td>
                                );
                              },
                            )
                          : " - "}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {report.isSuccess && (data?.breakdown?.length ?? 0) === 0 && (
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

const InfoCard = ({
  className,
  title,
  value,
}: {
  className: string;
  title: string;
  value: string;
}) => (
  <div className={className}>
    <div className="text-slate-500 text-xs mb-1">{title}</div>
    <div className="font-medium truncate">{value}</div>
  </div>
);

const Chip = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) => (
  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center gap-1">
    {label}
    {onRemove && (
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-700 ml-1"
      >
        ×
      </button>
    )}
  </span>
);

export default Main;