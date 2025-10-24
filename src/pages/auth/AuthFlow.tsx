
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthStage } from "./types";
import { slideLeftVariants, slideRightVariants } from "./transitions";
import LoginForm from "./LoginForm";
import ForgotForm from "./ForgotForm";
import OtpForm from "./OtpForm";
import ResetForm from "./ResetForm";
import { useLogin, useSendOtp, useVerifyOtp, useResetPassword } from "./hooks";
import { useNavigate } from "react-router-dom";

type Direction = "FWD" | "BACK";

export default function AuthFlow() {
  const [stage, setStage] = useState<AuthStage>(AuthStage.LOGIN);
  const [direction, setDirection] = useState<Direction>("FWD");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false)
  const login = useLogin();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const resetPw = useResetPassword();

  const go = (next: AuthStage, dir: Direction = "FWD") => {
    setDirection(dir);
    setStage(next);
  };

  const onLogin = async (payload: {
    email: string;
    password: string;
    remember: boolean;
  }) => {
    // backend expects "username"
    const res = await login.mutateAsync({
      username: payload.email,
      password: payload.password,
    });
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    navigate("/");
  };

  const onSendOtp = async (payload: { email: string }) => {
  setLoading(true);
  try {
    setEmail(payload.email);
    await sendOtp.mutateAsync({ username: payload.email });
    go(AuthStage.OTP, "FWD");
  } catch (err) {
    // optional: extra local handling/logging
    // toast handled in the hook already
  } finally {
    setLoading(false); // runs on success OR error
  }
};

 const onVerifyOtp = async (payload: { otp: string }) => {
  setLoading(true);
  try {
    setOtp(payload.otp);
    const res = await verifyOtp.mutateAsync({
      username: email,
      otp: payload.otp,
    });
    if (res?.reset_token) setResetToken(res.reset_token);
    go(AuthStage.RESET, "FWD");
  } catch (err) {
    // optional: extra local handling (toasts likely already in hook)
  } finally {
    setLoading(false);
  }
};

const onReset = async (payload: {
  newPassword: string;
  confirmPassword: string;
}) => {
  setLoading(true);
  try {
    await resetPw.mutateAsync({
      reset_token: resetToken,
      password: payload.newPassword,
      password_confirmation: payload.confirmPassword,
    });
    go(AuthStage.LOGIN, "BACK");
  } catch (err) {
    // optional handling
  } finally {
    setLoading(false);
  }
};
  const variants = direction === "FWD" ? slideLeftVariants : slideRightVariants;

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {stage === AuthStage.LOGIN && (
            <LoginForm
              onForgot={() => go(AuthStage.FORGOT, "FWD")}
              onSubmit={onLogin}
            />
          )}

          {stage === AuthStage.FORGOT && (
            <ForgotForm
              defaultEmail={email}
              onBack={() => go(AuthStage.LOGIN, "BACK")}
              onSubmit={onSendOtp}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {stage === AuthStage.OTP && (
            <OtpForm
              email={email}
              onBack={() => go(AuthStage.FORGOT, "BACK")}
              onSubmit={onVerifyOtp}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {stage === AuthStage.RESET && (
            <ResetForm
              onBack={() => go(AuthStage.OTP, "BACK")}
              onSubmit={onReset}
              loading={loading}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
