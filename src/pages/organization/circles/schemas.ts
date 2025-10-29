// src/features/circles/schemas.ts
import * as yup from "yup";

// helper to turn "" into undefined and strings into numbers
const toNumberOrUndef = (v: unknown, orig: unknown) =>
  orig === "" || orig === null || typeof orig === "undefined"
    ? undefined
    : Number(orig);

const emptyToNull = (v: unknown, orig: unknown) =>
  orig === "" ? null : orig;

export const circleSchema = yup.object({
  region_id: yup
  .number()
  .typeError("Region is required")
  .required("Region is required"),


  code: yup.string().trim().required("Code is required").max(20, "Max 20 chars"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 chars"),
  cirphno: yup.string().nullable().transform(emptyToNull).max(30, "Max 30 chars"),
  cirmob: yup.string().nullable().transform(emptyToNull).max(30, "Max 30 chars"),
  circompphno: yup.string().nullable().transform(emptyToNull).max(30, "Max 30 chars"),
});

export type CircleFormValues = yup.InferType<typeof circleSchema>;
