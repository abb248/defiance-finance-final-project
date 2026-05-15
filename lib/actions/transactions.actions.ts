"use server";

import { createClient } from "@supabase/supabase-js";

// Supabase URL ve Service Role Key'ini çekiyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseKey);

export const createTransaction = async (transactionData: any) => {
  try {
    // TAM OLARAK SENİN FOTOĞRAFTAKİ SÜTUN İSİMLERİNE GÖRE YAZIYORUZ:
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          amount: transactionData.amount, // Numeric sütun
          currency: "TRY", // Text sütun
          status: "success", // Text sütun
          type: "transfer", // Text sütun
          recipient_email: transactionData.email, // Text sütun
          // receiverId (Shareable ID) bilgisini kaybetmemek için description içine gömüyoruz:
          description: `Online Transfer - Sent to: ${transactionData.receiverId}`, 
        },
      ]);

    if (error) {
      console.error("Supabase Insert Error Detayı:", error);
      throw error;
    }

    console.log("Supabase'e işlem BAŞARIYLA kaydedildi:", data);
    return JSON.parse(JSON.stringify(data || {})); 
    
  } catch (error) {
    console.error("İşlem kaydedilirken hata oluştu:", error);
    return null;
  }
};