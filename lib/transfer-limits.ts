import { EXCHANGE_RATES } from "@/lib/utilsz";

export const SUPPORTED_TRANSFER_CURRENCIES = ["USD", "TRY", "EUR", "GBP", "CAD"] as const;

export type TransferCurrency = (typeof SUPPORTED_TRANSFER_CURRENCIES)[number];

const LARGE_TRANSFER_WARNING_USD = 1000;
const SINGLE_TRANSFER_LIMIT_USD = 5000;

const TRANSFER_LOCALES: Record<TransferCurrency, string> = {
  USD: "en-US",
  TRY: "tr-TR",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
};

export const isSupportedTransferCurrency = (currency?: string): currency is TransferCurrency =>
  SUPPORTED_TRANSFER_CURRENCIES.includes(currency as TransferCurrency);

export const normalizeTransferCurrency = (currency?: string): TransferCurrency =>
  isSupportedTransferCurrency(currency?.toUpperCase())
    ? (currency!.toUpperCase() as TransferCurrency)
    : "USD";

const convertUsdLimit = (amountUsd: number, currency: TransferCurrency) => {
  const converted = amountUsd * (EXCHANGE_RATES[currency] || 1);
  return Math.round(converted * 100) / 100;
};

export const formatTransferAmount = (amount: number, currency?: string) => {
  const normalizedCurrency = normalizeTransferCurrency(currency);

  return new Intl.NumberFormat(TRANSFER_LOCALES[normalizedCurrency], {
    style: "currency",
    currency: normalizedCurrency,
  }).format(amount);
};

export const getTransferLimit = (currency?: string) => {
  const normalizedCurrency = normalizeTransferCurrency(currency);

  return {
    currency: normalizedCurrency,
    warningAmount: convertUsdLimit(LARGE_TRANSFER_WARNING_USD, normalizedCurrency),
    maxAmount: convertUsdLimit(SINGLE_TRANSFER_LIMIT_USD, normalizedCurrency),
  };
};

export const isLargeTransferAmount = (amount: number, currency?: string) => {
  const { warningAmount, maxAmount } = getTransferLimit(currency);
  return Number.isFinite(amount) && amount >= warningAmount && amount <= maxAmount;
};

export const validateTransferAmount = (amount: number, currency?: string) => {
  const limit = getTransferLimit(currency);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      allowed: false,
      isLarge: false,
      message: "Please enter a valid amount greater than 0.",
      ...limit,
    };
  }

  if (amount > limit.maxAmount) {
    return {
      allowed: false,
      isLarge: false,
      message: `Single transfer limit is ${formatTransferAmount(limit.maxAmount, limit.currency)}. Please lower the amount or split the transfer.`,
      ...limit,
    };
  }

  return {
    allowed: true,
    isLarge: isLargeTransferAmount(amount, limit.currency),
    message: null,
    ...limit,
  };
};
