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

  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated." as const };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { defaultReceivingAccountId: normalizedAccountId }
    });

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Default receiving account update failed:", error);
    return { success: false, error: error?.message || "Could not update default account." as const };
  }
};

