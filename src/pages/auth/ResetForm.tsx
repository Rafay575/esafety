import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import PasswordInput from "@/components/Base/Form/PasswordInput";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { resetSchema } from "./schemas";

interface Props {
  onBack: () => void;
  onSubmit: (payload: { newPassword: string; confirmPassword: string }) => Promise<void> | void;
  loading: boolean; // parent-managed loading
}

type FormValues = { newPassword: string; confirmPassword: string };

export default function ResetForm({ onBack, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(resetSchema),
    mode: "onChange",          // so isValid updates as user types
    criteriaMode: "firstError",
  });

  const handleFormSubmit = async (values: FormValues) => {
    // no local loading; parent handles it
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-slate-500 hover:underline flex items-center gap-1"
      >
        <Lucide icon="ChevronLeft" className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Set New Password
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Use at least 6 characters. Avoid sharing your password.
        </p>
      </div>

      {/* Password Fields */}
      <div className="space-y-3">
        <div>
          <PasswordInput
            {...register("newPassword")}
            placeholder="New Password"
            className="block px-4 py-3 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 w-full"
          />
          {errors.newPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <PasswordInput
            {...register("confirmPassword")}
            placeholder="Confirm New Password"
            className="block px-4 py-3 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 w-full"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        variant="primary"
        className="w-full py-3 mt-4"
        type="submit"
        disabled={loading || !isValid || isSubmitting}
      >
        {loading ? "Saving..." : "Reset Password"}
      </Button>
    </form>
  );
}
