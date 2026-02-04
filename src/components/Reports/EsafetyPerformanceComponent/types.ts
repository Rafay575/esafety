// src/features/esafetyReport/types.ts

export type ESafetyReportCountParams = {
  circle_id?: number | string;
  division_id?: number | string;
  sub_division_id?: number | string;
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
};

export type ESafetyReportCountResponse =
  | number
  | {
      count?: number;
      total?: number;
      data?: {
        count?: number;
        total?: number;
      };
      message?: string;
    };
