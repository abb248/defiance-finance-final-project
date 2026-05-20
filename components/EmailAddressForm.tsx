"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

import { updateUserEmailAddress } from "@/lib/actions/user.actions";

type EmailAddressFormProps = {
  user: User;
};

const EmailAddressForm = ({ user }: EmailAddressFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState(user.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const result = await updateUserEmailAddress(email);
    setIsSaving(false);

    if (!result.success) {
      setMessage({
        type: "error",
        text: result.error || "Email address could not be updated.",
      });
      return;
    }

    setMessage({
      type: "success",
      text:
        result.message ||
        "Verification email sent. Please confirm it before the new email becomes active.",
    });
    router.refresh();
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Mail size={19} />
        </div>
        <div>
          <h2 className="text-18 font-semibold text-gray-900">Email address</h2>
          <p className="text-13 text-gray-600">
            Update your sign-in email. A verification step may be required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-12 font-semibold text-gray-600">New email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-class h-11 px-3 text-14"
            placeholder="name@example.com"
            type="email"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving || !email}
          className="flex-center h-11 rounded-lg bg-bank-gradient px-4 text-14 font-semibold text-white shadow-form disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send verification"
          )}
        </button>

        {message ? (
          <p
            className={
              message.type === "success"
                ? "text-13 font-medium text-success-700"
                : "text-13 font-medium text-red-600"
            }
          >
            {message.text}
          </p>
        ) : null}
      </form>
    </section>
  );
};

export default EmailAddressForm;
