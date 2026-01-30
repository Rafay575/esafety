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

  // ✔ FIXED — store string "yyyy-mm-dd"
  date_of_joining: yup
  .string()
  .required("Date of Joining is required")
  .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-mm-dd)"),

  date_of_birth: yup
  .string()
  .required("Date of Birth is required")
  .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-mm-dd)"),


  // ✔ Only required on create
  password: yup.string().when("$isEdit", {
    is: false,
    then: (s) => s.min(8).required("Password is required"),
    otherwise: (s) => s.notRequired(),
  }),

  password_confirmation: yup.string().when("$isEdit", {
    is: false,
    then: (s) => s.oneOf([yup.ref("password")], "Passwords must match"),
    otherwise: (s) => s.notRequired(),
  }),
});

export type FormValues = yup.InferType<typeof schema>;
