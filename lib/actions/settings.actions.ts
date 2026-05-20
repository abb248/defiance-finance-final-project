"use server";

import { createAdminClient, createSessionClient } from "@/lib/supabase/server";

const isMissingColumnError = (error: any) => {
  const msg = String(error?.message || "");
  const code = String(error?.code || "");
  return code === "42703" || msg.includes("does not exist") || msg.includes("Could not find");
};

export const updateDefaultReceivingAccount = async (accountId: string) => {
  const normalizedAccountId = String(accountId || "").trim();
  if (!normalizedAccountId) {
    return { success: false, error: "Missing account id." as const };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Not authenticated." as const };
  }

  const admin = await createAdminClient();

  const userKeyColumns = ["userID", "userId", "user_id", "auth_user_id"] as const;
  const targetColumns = [
    "default_receiving_account_id",
    "defaultReceivingAccountId",
    "default_account_id",
    "defaultAccountId",
  ] as const;

  let lastError: any = null;

  for (const key of userKeyColumns) {
    for (const targetColumn of targetColumns) {
      const { error } = await (admin as any)
        .from("users")
        .update({ [targetColumn]: normalizedAccountId })
        .eq(key, user.id);

      if (!error) {
        return { success: true, error: null as const };
      }

      if (isMissingColumnError(error)) {
        lastError = error;
        continue;
      }

      lastError = error;
      break;
    }
  }

  console.error("Default receiving account update failed:", lastError);
  return { success: false, error: "Could not update default account." as const };
};

