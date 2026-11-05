import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import sevaLogo from "../assets/seva_logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

// Validation schema
const signInSchema = yup.object({
  email: yup
    .string()
    .required("Enter your email address")
    .email("Enter an email like name@sevakendra.org"),
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Passwords have at least 6 characters"),
});

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: yupResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, []); // Remove clearError from dependencies

  const onSubmit = async (data) => {
    try {
      const result = await login(data);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError("root", { message: result.error });
      }
    } catch (err) {
      setError("root", { message: "We couldn't reach the server. Check your internet connection and try again." });
    }
  };

  const formError = error || errors.root?.message;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <ThemeToggle className="absolute right-4 top-4" />
      <main className="w-full max-w-[25rem]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={sevaLogo} alt="" className="mb-4 h-16 w-16 rounded-xl bg-card object-contain p-2 shadow-sm ring-1 ring-border" />
          <h1 className="text-[1.75rem] font-semibold leading-tight text-foreground">Sign in to Seva Kendra</h1>
          <p className="mt-2 text-[0.9375rem] text-muted-foreground">Records and follow-ups for our Calcutta programmes</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {formError && (
            <div role="alert" className="mb-5 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[0.9375rem] text-foreground">
              <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-destructive" aria-hidden />
              <span>{/invalid|incorrect|wrong|credential/i.test(formError) ? "That email and password don't match. Check them and try again." : formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-12"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" aria-busy={isLoading}>
              {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" aria-hidden />}
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Forgot your password or need an account? Ask your Seva Kendra administrator.
        </p>
      </main>
    </div>
  );
}
