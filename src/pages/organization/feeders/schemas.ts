import * as yup from "yup";

export const feederSchema = yup.object({
  sub_division_id: yup.number().required("Sub-Division is required").typeError("Sub-Division is required"),
  grid_station_id: yup.number().nullable(),
  code: yup.string().trim().required("Code is required").max(20, "Max 20 chars"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 chars"),
  voltage_level: yup.string().nullable().max(20),
  lat: yup.string().nullable().max(30),
  lng: yup.string().nullable().max(30),
  description: yup.string().nullable().max(500),
});

export type FeederFormValues = yup.InferType<typeof feederSchema>;
