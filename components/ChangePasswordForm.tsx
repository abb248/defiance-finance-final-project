"use client";

import React, { useState } from "react";
import { updateUserPassword } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Loader2, LockKeyhole } from "lucide-react";

const ChangePasswordForm = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserPassword(newPassword);
      if (result.success) {
        setMessage({ type: "success", text: "Password updated successfully." });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: result.error || "Password could not be updated." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <LockKeyhole size={19} />
        </div>
        <div>
          <h2 className="text-18 font-semibold text-gray-900">Change password</h2>
          <p className="text-13 text-gray-600">
            Use a stronger password for future sign ins.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-12 font-semibold text-gray-600">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-class h-11 px-3 text-14"
            placeholder="At least 8 characters"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-12 font-semibold text-gray-600">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-class h-11 px-3 text-14"
            placeholder="Re-enter your password"
          />
        </div>

        {message && (
          <p className={`text-14 font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading || !newPassword || !confirmPassword}
          className="mt-1 h-11 rounded-lg bg-bank-gradient text-14 font-semibold text-white shadow-form"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
