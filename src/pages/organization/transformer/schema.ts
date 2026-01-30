import * as yup from "yup";

export const transformerSchema = yup.object({
  sub_division_id: yup.number().required("Sub-Division is required").typeError("Required"),
  feeder_id: yup.number().required("Feeder is required").typeError("Required"),
  transformer_id: yup.string().required("Transformer ID is required").max(50),
  transformer_ref_no: yup.string().nullable().max(50),
  transformer_id_by_disco: yup.string().nullable().max(50),
  location_id: yup.string().nullable().max(50),
  address: yup.string().nullable().max(500),
  latitude: yup.number().nullable(),
  longitude: yup.number().nullable(),
});

export type TransformerFormValues = yup.InferType<typeof transformerSchema>;
