import * as yup from "yup";

export const divisionSchema = yup.object({
  circle_id: yup
    .number()
    .typeError("Circle is required")
    .required("Circle is required"),
  code: yup.string().trim().required("Code is required").max(20, "Max 20 chars"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 chars"),
  divphno: yup.string().trim().max(20, "Max 20 chars").nullable(),
  divmob: yup.string().trim().max(20, "Max 20 chars").nullable(),
  divcompphno: yup.string().trim().max(20, "Max 20 chars").nullable(),
  description: yup.string().trim().max(500, "Max 500 chars").required(),
});

export type DivisionFormValues = yup.InferType<typeof divisionSchema>;
