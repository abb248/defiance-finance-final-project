"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const createTransaction = async (transactionData: TransferTransactionData) => {
  try {
    const description = [
      transactionData.name || "Online Transfer",
      `From: ${transactionData.senderId}`,
      `Sent to: ${transactionData.receiverId}`,
      transactionData.note ? `Note: ${transactionData.note}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          amount: transactionData.amount,
          currency: "TRY",
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
      throw error;
    }

    return JSON.parse(JSON.stringify(data || {}));
  } catch (error) {
    console.error("Transaction could not be saved:", error);
    return null;
  }
};
export const verifyRecipient = async (shareableId: string, email: string) => {
  try {
    const { data, error } = await supabase
      .from("users") 
      .select("*")
      .eq("id", shareableId) 
      .eq("email", email)
      .single();

    if (error || !data) {
      return false; 
    }
    return true; 
  } catch (error) {
    console.error("Güvenlik doğrulaması sırasında hata:", error);
    return false;
  }
};