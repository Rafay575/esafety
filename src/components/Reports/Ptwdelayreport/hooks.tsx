import { useState } from "react";
import { PTWDelayReportData, PTWDelayItem, DelayStatus } from "./index";

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

const STATUSES: DelayStatus[] = [
  { code: "pending", label_en: "Pending" },
  { code: "approved", label_en: "Approved" },
  { code: "rejected", label_en: "Rejected" },
  { code: "closed", label_en: "Closed" },
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

export function useDelayStatuses() {
  return fakeQuery(() => STATUSES);
}

// ---------------------------------------------------------------------------
// Report data (dummy)
// ---------------------------------------------------------------------------

interface PTWDelayReportParams {
  region_id?: string;
  circle_id?: string;
  division_id?: string;
  sub_division_id?: string;
  status?: string;
  delayed_only?: boolean;
  from_date: string;
  to_date: string;
}

const ROLES = [
  "Sub-Division Officer",
  "Division Officer",
  "Circle Officer",
  "Grid Operator",
  "Shift Engineer",
];

const NAMES = [
  "M. Aslam",
  "Nasir Iqbal",
  "Faisal Mahmood",
  "Usman Tariq",
  "Bilal Ahmed",
  "Kashif Raza",
  "Imran Sheikh",
  "Waqas Younas",
];

function randOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findLabel(list: OptionItem[], value?: number | null) {
  return list.find((i) => i.value === value)?.label;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function buildDummyItems(
  count: number,
  circleName: string,
  divisionName: string,
  subDivisionName: string,
  fromDate: string,
  toDate: string,
  delayedOnly: boolean,
  statusFilter?: string,
): PTWDelayItem[] {
  const items: PTWDelayItem[] = [];
  const rangeStart = new Date(fromDate).getTime();
  const rangeEnd = new Date(toDate).getTime();
  const rangeSpan = Math.max(rangeEnd - rangeStart, 24 * 60 * 60 * 1000);

  const statusPool = statusFilter
    ? [statusFilter]
    : ["pending", "approved", "rejected", "closed"];

  for (let i = 1; i <= count; i++) {
    const assignedAt = new Date(rangeStart + Math.random() * rangeSpan);
    const slaMinutes = randOf([30, 45, 60, 90, 120]);

    // roughly half the dummy rows are delayed, unless filter forces it
    const forceDelayed = delayedOnly || i % 2 === 0;
    const responseMinutes = forceDelayed
      ? slaMinutes + 15 + Math.floor(Math.random() * 180)
      : Math.max(5, slaMinutes - 10 - Math.floor(Math.random() * 20));

    const status = randOf(statusPool);
    const stillPending = status === "pending" && Math.random() < 0.3;

    const respondedAt = stillPending
      ? null
      : addMinutes(assignedAt, responseMinutes);

    const isDelayed = stillPending
      ? Date.now() - assignedAt.getTime() > slaMinutes * 60000
      : responseMinutes > slaMinutes;

    const delayMinutes = stillPending
      ? Math.max(
          0,
          Math.floor((Date.now() - assignedAt.getTime()) / 60000) -
            slaMinutes,
        )
      : Math.max(0, responseMinutes - slaMinutes);

    items.push({
      id: i,
      ptw_reference: `PTW-2026-${2000 + i}`,
      circle_name: circleName,
      division_name: divisionName,
      sub_division_name: subDivisionName,
      user_name: randOf(NAMES),
      role: randOf(ROLES),
      assigned_at: assignedAt.toISOString(),
      responded_at: respondedAt ? respondedAt.toISOString() : null,
      response_minutes: stillPending ? null : responseMinutes,
      sla_minutes: slaMinutes,
      delay_minutes: delayMinutes,
      is_delayed: isDelayed,
      status: stillPending
        ? "Pending"
        : status.charAt(0).toUpperCase() + status.slice(1),
    });
  }

  return delayedOnly ? items.filter((i) => i.is_delayed) : items;
}

export function usePTWDelayReport() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<{ data: PTWDelayReportData } | undefined>(
    undefined,
  );

  const mutate = (params: PTWDelayReportParams) => {
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

    setTimeout(() => {
      const items = buildDummyItems(
        15,
        circleName,
        divisionName,
        subDivisionName,
        params.from_date,
        params.to_date,
        !!params.delayed_only,
        params.status,
      );

      const delayedCount = items.filter((i) => i.is_delayed).length;
      const avgDelay =
        delayedCount > 0
          ? Math.round(
              items
                .filter((i) => i.is_delayed)
                .reduce((sum, i) => sum + i.delay_minutes, 0) / delayedCount,
            )
          : 0;

      const dummy: PTWDelayReportData = {
        filters: {
          circle_id: params.circle_id ?? null,
          division_id: params.division_id ?? null,
          sub_division_id: params.sub_division_id ?? null,
          status: params.status ?? null,
          delayed_only: !!params.delayed_only,
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
        delayed_count: delayedCount,
        avg_delay_minutes: avgDelay,
        items,
      };

      setData({ data: dummy });
      setIsPending(false);
      setIsSuccess(true);
    }, 500);
  };

  return { mutate, isPending, isSuccess, data };
}
