"use server";

import Stripe from "stripe";
import { parseStringify } from "../utils";
import { validateTransferAmount } from "@/lib/transfer-limits";

// Stripe'ı Secret Key ile başlatıyoruz
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia", // Stripe API versiyonu (sabit kalabilir)
  typescript: true,
});

// 1. CREATE USER FUNCTION
// When someone registers, we will also save them to Stripe as a "Customer"
export const createStripeCustomer = async ({ name, email }: { name: string, email: string }) => {
  try {
    const customer = await stripe.customers.create({
      name,
      email,
    });

    // Stripe will return a customer ID (e.g., cus_12345)
    return parseStringify(customer);
  } catch (error) {
    console.error("Stripe customer creation error:", error);
    throw new Error("Could not create customer on Stripe.");
  }
};

// 2. INITIATE MONEY TRANSFER (PAYMENT)
// Will run when user clicks "Transfer Funds"
export const createTransfer = async ({ amount, memo, currency = 'USD' }: { amount: number, memo: string, currency?: string }) => {
  const transferAmountValidation = validateTransferAmount(amount, currency);

  if (!transferAmountValidation.allowed) {
    throw new Error(transferAmountValidation.message || "Transfer amount is outside the allowed limit.");
  }

  try {
    // IMPORTANT: Stripe processes amounts in cents. (e.g. 10 USD = 1000 cents)
    // So we multiply the amount by 100.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      description: memo, // Transaction description
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // On success, returns a "Client Secret" to open the payment screen on the front-end
    return parseStringify(paymentIntent);
  } catch (error) {
    console.error("Stripe transfer error:", error);
    throw new Error("Could not initiate transfer.");
  }
};
