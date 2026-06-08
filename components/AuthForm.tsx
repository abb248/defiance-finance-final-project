"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, LockKeyhole, ShieldCheck, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import CustomInput from "@/components/CustomInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  challenge2FA,
  signIn,
  signUp,
  verify2FA,
} from "@/lib/actions/user.actions";
import { authFormSchema } from "@/lib/utils";

const AuthForm = ({ type }: { type: "sign-in" | "sign-up" }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showMfa, setShowMfa] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const formSchema = authFormSchema(type);
  const isSignIn = type === "sign-in";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      address: "",
      state: "",
      postalCode: "",
      dateOfBirth: "",
      ssn: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setFormError(null);

    try {
      if (type === "sign-up") {
        const result = await signUp({
          email: data.email,
          password: data.password,
          firstName: data.firstName!,
          lastName: data.lastName!,
          address: data.address!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
        });

        if (result?.error) {
          setFormError(result.error);
        } else if (result?.user) {
          setUser(result.user as any);
        } else {
          setFormError("Sign up failed. Please try again.");
        }
      }

      if (type === "sign-in") {
        const result = await signIn({
          email: data.email,
          password: data.password,
        });

        if (result?.error) {
          setFormError(result.error);
        } else if (result?.requiresMfa && result?.factorId) {
          setShowMfa(true);
          setFactorId(result.factorId);
          setChallengeId(result.challengeId || "");
        } else if (result?.user) {
          router.replace("/");
          router.refresh();
        } else {
          setFormError("Sign in failed. Please try again.");
        }
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (mfaCode.length !== 6) {
      setFormError("Please enter the 6-digit code completely.");
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      let currentChallengeId = challengeId;

      if (!currentChallengeId) {
        const challenge = await challenge2FA(factorId);
        if (!challenge?.id) throw new Error("Verification could not be initiated.");
        currentChallengeId = challenge.id;
        setChallengeId(challenge.id);
      }

      const verify = await verify2FA(factorId, currentChallengeId, mfaCode);
      if (verify) {
        router.replace("/");
        router.refresh();
      } else {
        setFormError("Invalid code. Please enter the current code from your app.");
        setMfaCode("");

        const nextChallenge = await challenge2FA(factorId);
        setChallengeId(nextChallenge?.id || "");
      }
    } catch {
      setFormError("Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-card w-full rounded-2xl border border-blue-200/70 bg-white/85 p-6 text-[#111827] shadow-[0_24px_70px_rgba(15,82,140,0.16)] backdrop-blur-xl sm:p-8">
      <header className="mb-7 flex flex-col gap-6">
        <Link href="/" className="flex w-fit items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full border border-blue-100 bg-white/90 p-1.5 shadow-sm shadow-blue-900/5">
            <Image
              src="/brand/defiance-logo.jpg"
              width={44}
              height={44}
              alt="Defiance Finance logo"
              className="size-11 rounded-full object-contain"
              priority
            />
          </span>
          <span className="text-24 font-bold text-[#111827]">Defiance Finance</span>
        </Link>

        <div>
          <h1 className="text-30 font-semibold text-[#111827]">
            {user ? "Account created" : isSignIn ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-15 text-[#4B5563]">
            {user
              ? "Your account is ready. You can go to sign in when you are ready."
              : isSignIn
              ? "Welcome back. Open your shared money view."
              : "Create your account to gather balances, transfers, and everyday money tracking."}
          </p>
        </div>
      </header>

      {showMfa ? (
        <form onSubmit={handleMfaSubmit} className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-blue-700">
              <ShieldCheck size={18} />
              <h2 className="text-16 font-semibold">Two-factor authentication</h2>
            </div>
            <p className="text-14 text-gray-600">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <input
            type="text"
            maxLength={6}
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            className="input-class h-12 w-full px-3 text-center text-20 tracking-widest"
          />

          <Button
            type="submit"
            disabled={isLoading || mfaCode.length !== 6}
            className="h-12 w-full rounded-lg bg-bank-gradient text-15 font-semibold text-white shadow-form"
          >
            {isLoading ? "Verifying..." : "Verify code"}
          </Button>

          {formError ? <p className="text-13 font-medium text-red-600">{formError}</p> : null}
        </form>
      ) : user ? (
        <div
          className="flex flex-col items-center gap-5 rounded-lg border border-success-100 bg-success-25 px-5 py-8 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
            <CheckCircle2 className="size-8 text-success-700" />
          </div>
          <div>
            <h2 className="text-20 font-bold text-gray-900">Account created</h2>
            <p className="mt-2 text-14 text-gray-600">
              Your account has been created successfully. Please continue to sign in when you are ready.
            </p>
          </div>
          <div className="w-full rounded-lg border border-success-100 bg-white px-4 py-3 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 shrink-0 text-success-700" />
              <div>
                <p className="text-13 font-semibold text-gray-900">Registration complete</p>
                <p className="text-12 text-gray-600">
                  We saved your account details and prepared the sign in step.
                </p>
              </div>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/sign-in")}
            className="mt-2 h-11 w-full rounded-lg bg-bank-gradient text-14 font-semibold text-white"
          >
            Go to sign in
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            method="POST"
            noValidate
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const firstError = Object.values(errors)[0] as { message?: string } | undefined;
              setFormError(firstError?.message || "Please correct the highlighted fields.");
            })}
          className="space-y-5 [&_.form-label]:!text-[#23415F] [&_.input-class]:h-12 [&_.input-class]:rounded-xl [&_.input-class]:px-4 [&_.input-class]:text-14 [&_input]:!border-[#B9D7F0] [&_input]:!bg-[#F8FCFF]/90 [&_input]:!text-[#101828] [&_input]:shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] [&_input]:placeholder:!text-[#6B7F95] [&_input:focus]:!border-[#60A5FA] [&_input:focus]:!ring-4 [&_input:focus]:!ring-blue-100"
          >
            {type === "sign-up" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CustomInput
                  control={form.control}
                  name="firstName"
                  label="First name"
                  placeholder="ex: John"
                />
                <CustomInput
                  control={form.control}
                  name="lastName"
                  label="Last name"
                  placeholder="ex: Doe"
                />
              </div>
            ) : null}

            <CustomInput
              control={form.control}
              name="email"
              label="Email"
              placeholder="Enter your email"
            />
            <CustomInput
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
            />

            {isSignIn ? (
              <div className="-mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-13 font-semibold text-[#175CD3] hover:text-[#1849A9]"
                >
                  Forgot password?
                </Link>
              </div>
            ) : null}

            {type === "sign-up" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CustomInput
                  control={form.control}
                  name="address"
                  label="Address"
                  placeholder="Enter your address"
                />
                <CustomInput
                  control={form.control}
                  name="state"
                  label="State or city"
                  placeholder="ex: NY"
                />
                <CustomInput
                  control={form.control}
                  name="ssn"
                  label="SSN last 4 digits"
                  placeholder="1234"
                />
                <CustomInput
                  control={form.control}
                  name="dateOfBirth"
                  label="Date of birth"
                  placeholder="YYYY-MM-DD"
                />
                <CustomInput
                  control={form.control}
                  name="postalCode"
                  label="Postal code"
                  placeholder="ex: 11101"
                />
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#0F5EA8] via-[#1684D8] to-[#22A7E8] text-15 font-semibold text-white shadow-[0_14px_28px_rgba(21,116,196,0.28)] transition hover:from-[#0B4E92] hover:via-[#0875C4] hover:to-[#1595D6]"
            >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                {isSignIn ? "Checking account..." : "Creating account..."}
              </>
            ) : isSignIn ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>

            {formError ? <p className="text-13 font-medium text-red-600">{formError}</p> : null}

            <div className="flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white/55 px-3 py-2 text-12 font-medium text-[#315A7C]">
              <LockKeyhole className="size-4 text-[#1684D8]" />
              <span>Bank level security for your daily money hub</span>
            </div>
          </form>
        </Form>
      )}

      <footer className="mt-6 flex justify-center gap-1 text-14">
        <p className="text-[#4B5563]">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
        </p>
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="font-semibold text-[#175CD3] hover:text-[#1849A9]"
        >
          {isSignIn ? "Sign up" : "Sign in"}
        </Link>
      </footer>
    </section>
  );
};

export default AuthForm;
