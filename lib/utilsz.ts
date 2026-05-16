import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getAccountIdentifier = (account: {
  shareableId?: string;
  supabaseItemId?: string;
  id?: string;
}) => String(account.shareableId || account.supabaseItemId || account.id || "");

export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const normalizeCategoryName = (category?: string) =>
  (category || "Uncategorized").replace(/_/g, " ").trim() || "Uncategorized";

export const countTransactionCategories = (transactions: Transaction[] = []) => {
  const spendingTransactions = transactions.filter((transaction) => {
    const signedAmount =
      typeof transaction.signedAmount === "number"
        ? transaction.signedAmount
        : transaction.type === "debit"
        ? -Math.abs(Number(transaction.amount) || 0)
        : Number(transaction.amount) || 0;

    return signedAmount < 0;
  });

  const totalSpent = spendingTransactions.reduce((sum, transaction) => {
    const signedAmount =
      typeof transaction.signedAmount === "number"
        ? transaction.signedAmount
        : -Math.abs(Number(transaction.amount) || 0);

    return sum + Math.abs(signedAmount);
  }, 0);

  const grouped = spendingTransactions.reduce<Record<string, CategoryCount>>(
    (acc, transaction) => {
      const name = normalizeCategoryName(transaction.category);
      const amount = Math.abs(
        typeof transaction.signedAmount === "number"
          ? transaction.signedAmount
          : Number(transaction.amount) || 0
      );

      if (!acc[name]) {
        acc[name] = {
          name,
          count: 0,
          totalCount: spendingTransactions.length,
          totalAmount: 0,
          percentage: 0,
        };
      }

      acc[name].count += 1;
      acc[name].totalAmount += amount;
      acc[name].percentage = totalSpent
        ? Math.round((acc[name].totalAmount / totalSpent) * 100)
        : 0;

      return acc;
    },
    {}
  );

  return Object.values(grouped)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 4);
};

export const getLatestTransactionTime = (transactions: Transaction[] = []) =>
  transactions.reduce((latest, transaction) => {
    const time = new Date(transaction.date || 0).getTime();
    return time > latest ? time : latest;
  }, 0);

export const sortAccountsByRecentTransactions = (
  accounts: Account[],
  transactionsByAccountId: Record<string, Transaction[]>
) =>
  [...accounts].sort(
    (a, b) =>
      getLatestTransactionTime(transactionsByAccountId[b.supabaseItemId]) -
      getLatestTransactionTime(transactionsByAccountId[a.supabaseItemId])
  );
