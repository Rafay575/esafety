import { useState } from "react";
import { PTWTypeReportData, PTWTypeItem, PTWTypeSummaryRow, PTWType } from "./index";

// ---------------------------------------------------------------------------
// Dummy / mock data hooks - no backend required.
// Replace the bodies with real API calls once your endpoints are ready; the
// shapes returned here already match what index.tsx expects.
// ---------------------------------------------------------------------------

interface OptionItem {
  value: number;
  label: string;
}

const REGIONS: OptionItem[] = [
  { value: 1, label: "Central Region" },
  { value: 2, label: "South Region" },
];

const CIRCLES_BY_REGION: Record<number, OptionItem[]> = {
  1: [
    { value: 11, label: "Multan Circle" },
    { value: 12, label: "Vehari Circle" },
  ],
  2: [
    { value: 13, label: "Bahawalpur Circle" },
    { value: 14, label: "D.G. Khan Circle" },
  ],
};

const DIVISIONS_BY_CIRCLE: Record<number, OptionItem[]> = {
  11: [
    { value: 111, label: "Multan City Division" },
    { value: 112, label: "Multan Cantt Division" },
  ],
  12: [{ value: 121, label: "Vehari Division" }],
  13: [{ value: 131, label: "Bahawalpur Division" }],
  14: [{ value: 141, label: "D.G. Khan Division" }],
};

const SUB_DIVISIONS_BY_DIVISION: Record<number, OptionItem[]> = {
  111: [
    { value: 1111, label: "Sub Division-1" },
    { value: 1112, label: "Sub Division-2" },
  ],
  112: [{ value: 1121, label: "Cantt Sub Division-1" }],
  121: [{ value: 1211, label: "Vehari Sub Division-1" }],
  131: [{ value: 1311, label: "Bahawalpur Sub Division-1" }],
  141: [{ value: 1411, label: "D.G. Khan Sub Division-1" }],
};

// The 3 PTW types used by this system
const PTW_TYPES: PTWType[] = [
  { code: "planned", label_en: "Planned" },
  { code: "emergency", label_en: "Emergency" },
  { code: "misc", label_en: "Misc" },
];

function fakeQuery<T>(dataFn: () => T) {
  return { data: dataFn(), isLoading: false };
}

export function useRegions() {
  return fakeQuery(() => REGIONS);
}

export function useCircles(regionId: number | null) {
  return fakeQuery(() => (regionId ? CIRCLES_BY_REGION[regionId] || [] : []));
}

export function useDivisions(circleId: number | null) {
  return fakeQuery(() =>
    circleId ? DIVISIONS_BY_CIRCLE[circleId] || [] : [],
  );
}

export function useSubDivisions(divisionId: number | null) {
  return fakeQuery(() =>
    divisionId ? SUB_DIVISIONS_BY_DIVISION[divisionId] || [] : [],
  );
}

export function usePTWTypes() {
  return fakeQuery(() => PTW_TYPES);
}

// ---------------------------------------------------------------------------
// Report data (dummy)
// ---------------------------------------------------------------------------

interface PTWTypeReportParams {
  region_id?: string;
  circle_id?: string;
  division_id?: string;
  sub_division_id?: string;
  ptw_types?: string[];
  from_date: string;
  to_date: string;
}

const FEEDERS = [
  "Feeder-Multan-01",
  "Feeder-Vehari-02",
  "Feeder-Shujabad-03",
  "Feeder-Jalalpur-04",
  "Feeder-Kabirwala-05",
];

const STATUSES = ["Approved", "Closed", "Pending", "Rejected"];

// weighted so Emergency shows up often but isn't the only type
const TYPE_WEIGHTS: Record<string, number> = {
  emergency: 4,
  planned: 3,
  misc: 1,
};

function randOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findLabel(list: OptionItem[], value?: number | null) {
  return list.find((i) => i.value === value)?.label;
}

function weightedType(allowedCodes: string[]): string {
  const pool: string[] = [];
  allowedCodes.forEach((code) => {
    const weight = TYPE_WEIGHTS[code] || 1;
    for (let i = 0; i < weight; i++) pool.push(code);
  });
  return randOf(pool);
}

function buildDummyItems(
  count: number,
  circleName: string,
  divisionName: string,
  subDivisionName: string,
  fromDate: string,
  toDate: string,
  allowedTypeCodes: string[],
): PTWTypeItem[] {
  const items: PTWTypeItem[] = [];
  const rangeStart = new Date(fromDate).getTime();
  const rangeEnd = new Date(toDate).getTime();
  const rangeSpan = Math.max(rangeEnd - rangeStart, 24 * 60 * 60 * 1000);

  for (let i = 1; i <= count; i++) {
    const typeCode = weightedType(allowedTypeCodes);
    const typeLabel =
      PTW_TYPES.find((t) => t.code === typeCode)?.label_en || typeCode;
    const issuedAt = new Date(rangeStart + Math.random() * rangeSpan);

    items.push({
      id: i,
      sr_no: 0, // assigned below, after sorting by date
      ptw_reference: `PTW-2026-${3000 + i}`,
      ptw_type_code: typeCode,
      ptw_type_label: typeLabel,
      circle_name: circleName,
      division_name: divisionName,
      sub_division_name: subDivisionName,
      feeder_name: randOf(FEEDERS),
      issued_at: issuedAt.toISOString(),
      duration_hours: 1 + Math.floor(Math.random() * 8),
      status: randOf(STATUSES),
    });
  }

  const sorted = items.sort(
    (a, b) => new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime(),
  );

  // Renumber Sr. No. sequentially in final (date-sorted) order
  sorted.forEach((item, idx) => {
    item.sr_no = idx + 1;
  });

  return sorted;
}

function buildSummary(items: PTWTypeItem[]): PTWTypeSummaryRow[] {
  const counts = new Map<string, { label: string; count: number }>();

  items.forEach((item) => {
    const existing = counts.get(item.ptw_type_code);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(item.ptw_type_code, {
        label: item.ptw_type_label,
        count: 1,
      });
    }
  });

  const total = items.length || 1;

  return Array.from(counts.entries())
    .map(([code, { label, count }]) => ({
      ptw_type_code: code,
      ptw_type_label: label,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

export function usePTWTypeReport() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<{ data: PTWTypeReportData } | undefined>(
    undefined,
  );

  const mutate = (params: PTWTypeReportParams) => {
    setIsPending(true);
    setIsSuccess(false);

    const circleId = params.circle_id ? parseInt(params.circle_id) : null;
    const divisionId = params.division_id
      ? parseInt(params.division_id)
      : null;
    const subDivisionId = params.sub_division_id
      ? parseInt(params.sub_division_id)
      : null;

    const circleName = circleId
      ? findLabel(Object.values(CIRCLES_BY_REGION).flat(), circleId) ||
        "Multan Circle"
      : "Multan Circle";

    const divisionName = divisionId
      ? findLabel(Object.values(DIVISIONS_BY_CIRCLE).flat(), divisionId) ||
        "Multan City Division"
      : "Multan City Division";

    const subDivisionName = subDivisionId
      ? findLabel(
          Object.values(SUB_DIVISIONS_BY_DIVISION).flat(),
          subDivisionId,
        ) || "Sub Division-1"
      : "Sub Division-1";

    const allowedTypeCodes =
      params.ptw_types && params.ptw_types.length > 0
        ? params.ptw_types
        : PTW_TYPES.map((t) => t.code);

    setTimeout(() => {
      const items = buildDummyItems(
        20,
        circleName,
        divisionName,
        subDivisionName,
        params.from_date,
        params.to_date,
        allowedTypeCodes,
      );

      const dummy: PTWTypeReportData = {
        filters: {
          circle_id: params.circle_id ?? null,
          division_id: params.division_id ?? null,
          sub_division_id: params.sub_division_id ?? null,
          ptw_types: params.ptw_types,
          from_date: params.from_date,
          to_date: params.to_date,
        },
        breadcrumb: {
          circle: circleId
            ? { name: circleName, code: `C${circleId}` }
            : undefined,
          division: divisionId
            ? { name: divisionName, code: `D${divisionId}` }
            : undefined,
          sub_division: subDivisionId
            ? { name: subDivisionName, code: `S${subDivisionId}` }
            : undefined,
        },
        total_count: items.length,
        summary: buildSummary(items),
        items,
      };

      setData({ data: dummy });
      setIsPending(false);
      setIsSuccess(true);
    }, 500);
  };

  return { mutate, isPending, isSuccess, data };
}
