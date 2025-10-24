// src/features/regions/schemas.ts
import * as yup from "yup";

export const regionSchema = yup.object({
  code: yup.string().trim().required("Code is required").max(20, "Max 20 chars"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 chars"),
  description: yup.string().trim().max(500, "Max 500 chars"),
});

export type RegionFormValues = yup.InferType<typeof regionSchema>;
