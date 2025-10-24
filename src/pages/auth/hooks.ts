// src/features/auth/hooks.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
  import { loginApi, sendOtpApi, verifyOtpApi, resetPasswordApi } from "./api";

import type { LoginRequest, LoginResponse } from "./types";

export const useLogin = () =>
  useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: (payload) => {
      const t = toast.loading("Signing in…");
      return loginApi(payload)
        .then((res) => {
          toast.success("Signed in successfully", { id: t });
          return res;
        })
        .catch((err) => {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Invalid credentials.";
          toast.error(msg, { id: t });
          throw err;
        });
    },
  });


// --- SEND OTP ---
export const useSendOtp = () =>
  useMutation({
    mutationFn: sendOtpApi,
    onMutate: () => toast.loading("Sending OTP..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("OTP sent successfully");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    },
  });

// --- VERIFY OTP ---
export const useVerifyOtp = () =>
  useMutation({
    mutationFn: verifyOtpApi,
    onMutate: () => toast.loading("Verifying OTP..."),
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("OTP verified successfully");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Invalid OTP");
    },
  });

// --- RESET PASSWORD ---
export const useResetPassword = () =>
  useMutation({
    mutationFn: resetPasswordApi,
    onMutate: () => toast.loading("Resetting password..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Password reset successful!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to reset password");
    },
  });