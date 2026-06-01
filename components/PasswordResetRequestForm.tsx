"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/actions/user.actions";

const PasswordResetRequestForm = ({ initialError }: { initialError?: string }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    initialError === "invalid_reset_link"
      ? "That reset link is invalid or expired. Request a new email to continue."
      : null
  );
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setMessage(null);

    try {
      const result = await requestPasswordReset(email);
      if (result.error) {
        setFormError(result.error);
        return;
      }

      setMessage(
        result.message || "If an account exists for that email, we sent password reset instructions."
      );
    } catch {
      setMessage("If an account exists for that email, we sent password reset instructions.");
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
          <h1 className="text-30 font-semibold text-[#111827]">Reset password</h1>
          <p className="mt-2 text-15 text-[#4B5563]">
            Enter your account email and we will send a secure reset link.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 [&_input]:!border-[#B9D7F0] [&_input]:!bg-[#F8FCFF]/90 [&_input]:!text-[#101828] [&_input]:placeholder:!text-[#6B7F95] [&_input:focus]:!border-[#60A5FA] [&_input:focus]:!ring-4 [&_input:focus]:!ring-blue-100"
      >
        <label className="flex flex-col gap-2 text-14 font-semibold text-[#23415F]">
          Email
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="h-12 rounded-xl px-4 text-14"
          />
        </label>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-gradient-to-r from-[#0F5EA8] via-[#1684D8] to-[#22A7E8] text-15 font-semibold text-white shadow-[0_14px_28px_rgba(21,116,196,0.28)] transition hover:from-[#0B4E92] hover:via-[#0875C4] hover:to-[#1595D6]"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Sending link...
            </>
          ) : (
            <>
              <Mail size={18} className="mr-2" />
              Send reset link
            </>
          )}
        </Button>

        {formError ? <p className="text-13 font-medium text-red-600">{formError}</p> : null}

        {message ? (
          <div className="flex items-start gap-3 rounded-lg border border-success-100 bg-success-25 px-4 py-3 text-success-700">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p className="text-13 font-medium">{message}</p>
          </div>
        ) : null}
      </form>

      <footer className="mt-6 flex justify-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 text-14 font-semibold text-[#175CD3] hover:text-[#1849A9]"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </footer>
    </section>
  );
};

export default PasswordResetRequestForm;
