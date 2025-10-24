// components/auth/types.ts
export enum AuthStage {
  LOGIN = "LOGIN",
  FORGOT = "FORGOT",
  OTP = "OTP",
  RESET = "RESET",
}

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

export interface ForgotPayload {
  email: string;
}

export interface OtpPayload {
  email: string;
  otp: string; // 6 digits
}

export interface ResetPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// Stub APIs to integrate later:
export const AuthAPI = {
  login: async (_payload: LoginPayload) => {
    // await axios.post("/api/login", payload)
    await new Promise((r) => setTimeout(r, 600));
  },
  sendOtp: async (_payload: ForgotPayload) => {
    await new Promise((r) => setTimeout(r, 600));
  },
  verifyOtp: async (_payload: OtpPayload) => {
    await new Promise((r) => setTimeout(r, 400));
  },
  resetPassword: async (_payload: ResetPayload) => {
    await new Promise((r) => setTimeout(r, 600));
  },
};


// src/features/auth/types.ts
export interface LoginRequest {
  username: string; // email/phone/sap will be sent as username
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    sap_code: string;
    roles: string[];
    permissions: string[];
  };
}
