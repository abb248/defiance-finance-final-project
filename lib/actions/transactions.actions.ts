"use server";

import { getAccounts } from "@/lib/actions/bank.actions";
import { isDemoAccountId } from "@/lib/demo-data";
import { validateTransferAmount } from "@/lib/transfer-limits";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const createTransaction = async (transactionData: TransferTransactionData) => {
  try {
    const currency = transactionData.currency || "USD";
    const transferAmountValidation = validateTransferAmount(transactionData.amount, currency);

    if (!transferAmountValidation.allowed) {
      throw new Error(transferAmountValidation.message || "Transfer amount is outside the allowed limit.");
    }

    const description = [
      transactionData.name || "Online Transfer",
      `From: ${transactionData.senderId}`,
      `Sent to: ${transactionData.receiverId}`,
      transactionData.referenceNumber ? `Reference: ${transactionData.referenceNumber}` : null,
      transactionData.note ? `Note: ${transactionData.note}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          amount: transactionData.amount,
          currency,
          status: "success",
          type: "transfer",
          recipient_email: transactionData.email,
          description,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      if (
        isDemoAccountId(transactionData.senderId) ||
        isDemoAccountId(transactionData.receiverId)
      ) {
        return JSON.parse(
          JSON.stringify({
            id: transactionData.referenceNumber || `demo-transfer-${Date.now()}`,
            amount: transactionData.amount,
            currency,
            status: "success",
            type: "transfer",
            recipient_email: transactionData.email,
            description,
            created_at: new Date().toISOString(),
            is_demo_fallback: true,
          })
        );
      }

      throw error;
    }

    return JSON.parse(JSON.stringify(data || {}));
  } catch (error) {
    console.error("Transaction could not be saved:", error);
    return null;
  }
};
const accountMatchesShareableId = (account: Account, shareableId: string) => {
  const accountIds = [account.shareableId, account.supabaseItemId, account.id].map(
    (value) => String(value || "").trim()
  );

  return accountIds.includes(shareableId);
};

export const verifyRecipient = async (shareableId: string, email: string) => {
  try {
    const normalizedId = shareableId.trim();
    const trimmedEmail = email.trim();

    if (!normalizedId || !trimmedEmail) {
      return false;
    }

    const emailsToTry = Array.from(new Set([trimmedEmail, trimmedEmail.toLowerCase()]));

    for (const tryEmail of emailsToTry) {
      const accounts = await getAccounts({ email: tryEmail });
      const accountsData = accounts?.data || [];

      const hasMatchingAccount = accountsData.some((account: Account) =>
        accountMatchesShareableId(account, normalizedId)
      );

      if (hasMatchingAccount) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Recipient verification failed:", error);
    return false;
  }
};
