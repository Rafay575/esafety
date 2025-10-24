// src/features/auth/schemas.ts
import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup.string().trim().required("Email / Phone / SAP is required"),
  password: yup.string().required("Password is required"),
  remember: yup.boolean().default(false),
});

export const forgotSchema = yup.object({
  email: yup.string().email("Enter valid email").required("Email is required"),
});

export const otpSchema = yup.object({
  otp: yup
    .string()
    .required("OTP required")
    .matches(/^\d{8}$/, "Must be 8 digits"),
});

export const resetSchema = yup.object({
  newPassword: yup.string().min(8).required("New password required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password required"),
});