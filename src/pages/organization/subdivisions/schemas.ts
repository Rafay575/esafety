import * as yup from "yup";

export const subDivisionSchema = yup.object({
  division_id: yup
    .number()
    .required("Division is required")
    .typeError("Division is required"),
  circle_id: yup
    .number()
    .required("Circle is required")
    .typeError("Circle is required"),
  code: yup.string().trim().required("Code is required").max(20, "Max 20 chars"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 chars"),
  sdivphno: yup.string().nullable().max(20, "Max 20 chars"),
  sdivmob: yup.string().nullable().max(20, "Max 20 chars"),
  sdivcompphno: yup.string().nullable().max(20, "Max 20 chars"),
  description: yup.string().nullable().max(500, "Max 500 chars"),
});

export type SubDivisionFormValues = yup.InferType<typeof subDivisionSchema>;
