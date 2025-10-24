// src/features/auth/api.ts
import { api } from "@/lib/axios";
import type { LoginRequest, LoginResponse } from "./types";

export async function loginApi(payload: LoginRequest) {
  const { data } = await api.post<LoginResponse>("/api/v1/auth/login", payload);
  return data;
}

export const sendOtpApi = async (payload: { username: string }) => {
  const { data } = await api.post("/api/v1/auth/password/otp", payload);
  return data;
};

// --- VERIFY OTP ---
export const verifyOtpApi = async (payload: { username: string; otp: string }) => {
  const { data } = await api.post("/api/v1/auth/password/verify", payload);
  // Expected response: { reset_token: "abc123..." }
  return data;
};

// --- RESET PASSWORD ---
export const resetPasswordApi = async (payload: {
  reset_token: string;
  password: string;
  password_confirmation: string;
}) => {
  const { data } = await api.post("/api/v1/auth/password/reset", payload);
  return data;
};