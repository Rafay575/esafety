// components/auth/ForgotForm.tsx
import { useState } from "react";
import { FormInput } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";

interface Props {
  defaultEmail?: string;
  onBack: () => void;
  onSubmit: (payload: { email: string }) => Promise<void> | void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function ForgotForm({ defaultEmail = "", onBack, onSubmit,loading,setLoading }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!email) return;

    await onSubmit({ email });
    setMsg("If the email exists, an OTP has been sent.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs text-slate-500 hover:underline flex items-center gap-1">
        <Lucide icon="ChevronLeft" className="w-4 h-4" /> Back to Login
      </button>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Forgot Password</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your official email. We’ll send an OTP.</p>
      </div>

      <FormInput
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block px-4 py-3 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 w-full"
        placeholder="you@company.gov.pk"
      />

      {msg && <div className="text-emerald-600 text-xs">{msg}</div>}

      <Button variant="primary" className="w-full py-3" type="submit" disabled={loading || !email}>
        {loading ? "Sending..." : "Send OTP"}
      </Button>
    </form>
  );
}
