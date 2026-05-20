"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound } from "lucide-react";

import { updateUserProfileName } from "@/lib/actions/user.actions";

type ProfileNameFormProps = {
  user: User;
};

const ProfileNameForm = ({ user }: ProfileNameFormProps) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const result = await updateUserProfileName({ firstName, lastName });
    setIsSaving(false);

    if (!result.success) {
      setMessage({
        type: "error",
        text: result.error || "Profile name could not be updated.",
      });
      return;
    }

    setMessage({ type: "success", text: "Profile name updated." });
    router.refresh();
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <UserRound size={19} />
        </div>
        <div>
          <h2 className="text-18 font-semibold text-gray-900">Profile name</h2>
          <p className="text-13 text-gray-600">
            This name appears in the sidebar and dashboard greeting.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-12 font-semibold text-gray-600">First name</span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="input-class h-11 px-3 text-14"
            placeholder="First name"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-12 font-semibold text-gray-600">Last name</span>
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="input-class h-11 px-3 text-14"
            placeholder="Last name"
          />
        </label>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-center h-11 rounded-lg bg-bank-gradient px-4 text-14 font-semibold text-white shadow-form disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update profile"
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
        </div>
      </form>
    </section>
  );
};

export default ProfileNameForm;
