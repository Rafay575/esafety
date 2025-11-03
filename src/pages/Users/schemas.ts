import * as yup from "yup";

export const schema = yup.object({
  name: yup.string().required("Name is required"),
  gender: yup.string().required("Gender is required"),
  cnic: yup
    .string()
    .matches(/^\d{5}-\d{7}-\d{1}$/, "Invalid CNIC format")
    .required("CNIC is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(/^\+?\d[\d\s-]{6,}$/, "Invalid phone number")
    .required("Phone is required"),
  sap_code: yup.string().required("SAP Code is required"),
  department_id: yup.string().required("Department is required"),
  designation_id: yup.string().required("Designation is required"),
  role: yup.string().required("Role is required"),
    password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm password"),
});

export type FormValues = yup.InferType<typeof schema>;
