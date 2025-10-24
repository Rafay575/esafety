// components/auth/LoginForm.tsx
import { FormInput, FormCheck } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "./schemas";
import PasswordInput from "@/components/Base/Form/PasswordInput";

interface Props {
  onForgot: () => void;
  onSubmit: (payload: { email: string; password: string; remember: boolean }) => Promise<void> | void;
}

type FormValues = {
  email: string;
  password: string;
  remember: boolean;
};

export default function LoginForm({ onForgot, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const submit = async (data: FormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-3">
        <FormInput
          type="text"
          {...register("email")}
          className="block px-4 py-3 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 w-full"
          placeholder="Email/Phone/SAP code"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}

       <PasswordInput
  {...register("password")}
  placeholder="Password"
  className="block px-4 py-3 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-darkmode-800 w-full"
/>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <label className="flex items-center cursor-pointer">
          <FormCheck.Input
            id="remember-me"
            type="checkbox"
            checked={watch("remember")}
            onChange={(e) => setValue("remember", e.target.checked)}
            className="mr-2 border"
          />
          Remember me
        </label>
        <button type="button" onClick={onForgot} className="text-primary hover:underline">
          Forgot Password?
        </button>
      </div>

      <Button
        variant="primary"
        className="w-full py-3 text-sm font-semibold tracking-wide uppercase shadow-md"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
