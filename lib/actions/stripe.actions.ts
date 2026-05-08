"use server";

import Stripe from "stripe";
import { parseStringify } from "../utils";

// Stripe'ı Secret Key ile başlatıyoruz
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia", // Stripe API versiyonu (sabit kalabilir)
  typescript: true,
});

// 1. KULLANICI OLUŞTURMA FONKSİYONU
// Sitemize biri kayıt olduğunda, onu Stripe'a da "Müşteri" olarak kaydedeceğiz
export const createStripeCustomer = async ({ name, email }: { name: string, email: string }) => {
  try {
    const customer = await stripe.customers.create({
      name,
      email,
    });

    // Stripe bize müşteri ID'si dönecek (Örn: cus_12345)
    return parseStringify(customer);
  } catch (error) {
    console.error("Stripe müşteri oluşturma hatası:", error);
    throw new Error("Stripe üzerinde müşteri oluşturulamadı.");
  }
};

// 2. PARA TRANSFERİ (ÖDEME) BAŞLATMA FONKSİYONU
// Kullanıcı "Para Gönder" dediğinde çalışacak
export const createTransfer = async ({ amount, memo }: { amount: number, memo: string }) => {
  try {
    // ÖNEMLİ: Stripe'da paralar kuruş/cent cinsinden işlenir. (Yani 10 TL = 1000 kuruş)
    // Bu yüzden gelen amount değerini 100 ile çarpıyoruz.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "try", // Projeni Türkiye uyumlu yaptığımız için TRY seçtik
      description: memo, // İşlem açıklaması (Örn: "Kira ödemesi")
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Başarıyla oluşursa, bize front-end'de ödeme ekranını açacak bir "Client Secret" döner
    return parseStringify(paymentIntent);
  } catch (error) {
    console.error("Stripe transfer hatası:", error);
    throw new Error("Transfer işlemi başlatılamadı.");
  }
};