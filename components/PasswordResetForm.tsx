"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetRecoveredPassword } from "@/lib/actions/user.actions";

const PasswordResetForm = ({ canReset }: { canReset: boolean }) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setMessage(null);

    try {
      const result = await resetRecoveredPassword({ password, confirmPassword });

      if (result.error) {
        setFormError(result.error);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage(result.message || "Password updated. Please sign in with your new password.");
    } catch {
      setFormError("Password could not be updated. Please request a new reset link.");
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
          <h1 className="text-30 font-semibold text-[#111827]">Choose new password</h1>
          <p className="mt-2 text-15 text-[#4B5563]">
            Update your password, then sign in again to continue.
          </p>
        </div>
      </header>

      {!canReset ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-14 font-medium text-red-700">
              This reset link is invalid or expired. Request a new password reset email.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-[#0F5EA8] via-[#1684D8] to-[#22A7E8] text-15 font-semibold text-white shadow-[0_14px_28px_rgba(21,116,196,0.28)]"
          >
            Request new link
          </Button>
        </div>
      ) : message ? (
        <div className="flex flex-col items-center gap-5 rounded-lg border border-success-100 bg-success-25 px-5 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
            <CheckCircle2 className="size-8 text-success-700" />
          </div>
          <div>
            <h2 className="text-20 font-bold text-gray-900">Password updated</h2>
            <p className="mt-2 text-14 text-gray-600">{message}</p>
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
        <form
          onSubmit={handleSubmit}
          className="space-y-5 [&_input]:!border-[#B9D7F0] [&_input]:!bg-[#F8FCFF]/90 [&_input]:!text-[#101828] [&_input]:placeholder:!text-[#6B7F95] [&_input:focus]:!border-[#60A5FA] [&_input:focus]:!ring-4 [&_input:focus]:!ring-blue-100"
        >
          <label className="flex flex-col gap-2 text-14 font-semibold text-[#23415F]">
            New password
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your new password"
              className="h-12 rounded-xl px-4 text-14"
            />
          </label>

          <label className="flex flex-col gap-2 text-14 font-semibold text-[#23415F]">
            Confirm new password
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
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
                Updating password...
              </>
            ) : (
              <>
                <LockKeyhole size={18} className="mr-2" />
                Update password
              </>
            )}
          </Button>

          {formError ? <p className="text-13 font-medium text-red-600">{formError}</p> : null}
        </form>
      )}
    </section>
  );
};

export default PasswordResetForm;
