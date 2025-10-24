// components/auth/OtpForm.tsx
import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import OtpInput from "react-otp-input";

interface Props {
  email: string;
  onBack: () => void;
  onSubmit: (payload: { otp: string }) => Promise<void> | void;
    loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function OtpForm({ email, onBack, onSubmit , loading, setLoading }: Props) {
  const [otp, setOtp] = useState("");

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    await onSubmit({ otp });
  };

  // Auto-focus UX small touch
  useEffect(() => {
    setOtp("");
  }, [email]);

  return (
    <form onSubmit={handleContinue} className="space-y-5">
      <button type="button" onClick={onBack} className="text-xs text-slate-500 hover:underline flex items-center gap-1">
        <Lucide icon="ChevronLeft" className="w-4 h-4" /> Back
      </button>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Enter OTP</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          We sent a 6-digit code to <span className="font-medium">{email}</span>.
        </p>
      </div>

      <div className="flex justify-center">
        <OtpInput
          value={otp}
          onChange={setOtp}
          numInputs={6}
          inputType="tel"
          shouldAutoFocus
          renderInput={(props) => (
            <input
              {...props}
              className="mx-1 h-10 !w-10 text-gray-700 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 text-center text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        />
      </div>

      <Button variant="primary" className="w-full py-3" type="submit" disabled={loading || otp.length < 6}>
        {loading ? "Verifying..." : "Continue"}
      </Button>
    </form>
  );
}
