"use server";

import { getAccounts } from "@/lib/actions/bank.actions";
import { createSessionClient } from "@/lib/supabase/server";
import { getAccountIdentifier } from "@/lib/utilsz";

const accountBelongsToUser = (account: Account, accountId: string) =>
  [
    getAccountIdentifier(account),
    account.supabaseItemId,
    account.shareableId,
    account.id,
  ]
    .map((id) => String(id || "").trim())
    .includes(accountId);

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

    if (!user.email) {
      return { success: false, error: "User email is unavailable." as const };
    }

    const accounts = await getAccounts({ email: user.email });
    const accountsData = accounts?.data || [];
    const isOwnedAccount = accountsData.some((account: Account) =>
      accountBelongsToUser(account, normalizedAccountId)
    );

    if (!isOwnedAccount) {
      return {
        success: false,
        error: "Selected account does not belong to the signed-in user." as const,
      };
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

