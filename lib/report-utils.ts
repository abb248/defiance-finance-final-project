export type ReportCategoryBreakdown = {
  name: string;
  amount: number;
  percentage: number;
  count: number;
};

export type ReportMonthlyTrend = {
  month: string;
  income: number;
  spending: number;
  net: number;
};

export type ReportAccountActivity = {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  income: number;
  spending: number;
  transactionCount: number;
};

export type ReportTransactionHighlight = {
  id: string;
  name: string;
  amount: number;
  signedAmount: number;
  category: string;
  date: string;
  accountName: string;
};

export type FinancialReport = {
  monthLabel: string;
  previousMonthLabel: string;
  currentMonthIncome: number;
  currentMonthSpending: number;
  currentMonthNet: number;
  previousMonthSpending: number;
  spendingChangePercent: number;
  totalCurrentBalance: number;
  transactionCount: number;
  averageExpense: number;
  categoryBreakdown: ReportCategoryBreakdown[];
  monthlyTrend: ReportMonthlyTrend[];
  accountActivity: ReportAccountActivity[];
  largestExpense: ReportTransactionHighlight | null;
  topCategory: ReportCategoryBreakdown | null;
  mostActiveAccount: ReportAccountActivity | null;
  reportSummary: string[];
  assistantQuestion: string;
};

const getSignedAmount = (transaction: Transaction) => {
  if (typeof transaction.signedAmount === "number") return transaction.signedAmount;

  const amount = Math.abs(Number(transaction.amount) || 0);
  return transaction.type === "debit" ? -amount : amount;
};

const getTransactionDate = (transaction: Transaction) => {
  const date = new Date(transaction.date || 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeCategory = (category?: string) =>
  (category || "Uncategorized").replace(/_/g, " ").trim() || "Uncategorized";

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

const getMonthStart = (offset = 0) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
};

const getRecentMonths = (count: number) =>
  Array.from({ length: count }, (_, index) => getMonthStart(index - count + 1));

const toHighlight = (
  transaction: Transaction,
  accountName: string
): ReportTransactionHighlight => {
  const signedAmount = getSignedAmount(transaction);

  return {
    id: transaction.id,
    name: transaction.name,
    amount: Math.abs(signedAmount),
    signedAmount,
    category: normalizeCategory(transaction.category),
    date: transaction.date || "",
    accountName,
  };
};

export const buildFinancialReport = ({
  accounts,
  transactionsByAccountId,
  totalCurrentBalance,
}: {
  accounts: Account[];
  transactionsByAccountId: Record<string, Transaction[]>;
  totalCurrentBalance: number;
}): FinancialReport => {
  const currentMonthStart = getMonthStart();
  const previousMonthStart = getMonthStart(-1);
  const currentMonthKey = getMonthKey(currentMonthStart);
  const previousMonthKey = getMonthKey(previousMonthStart);

  const accountNameById = new Map(
    accounts.map((account) => [
      account.supabaseItemId,
      account.name || account.bankName || "Bank account",
    ])
  );

  const transactions = Object.entries(transactionsByAccountId).flatMap(
    ([accountId, accountTransactions]) =>
      accountTransactions.map((transaction) => ({
        transaction,
        accountId,
        date: getTransactionDate(transaction),
        signedAmount: getSignedAmount(transaction),
        accountName: accountNameById.get(accountId) || "Bank account",
      }))
  );

  const currentMonthTransactions = transactions.filter(
    (item) => item.date && getMonthKey(item.date) === currentMonthKey
  );
  const previousMonthTransactions = transactions.filter(
    (item) => item.date && getMonthKey(item.date) === previousMonthKey
  );
  const currentMonthExpenses = currentMonthTransactions.filter(
    (item) => item.signedAmount < 0
  );
  const currentMonthIncomeTransactions = currentMonthTransactions.filter(
    (item) => item.signedAmount > 0
  );
  const previousMonthExpenses = previousMonthTransactions.filter(
    (item) => item.signedAmount < 0
  );

  const currentMonthSpending = currentMonthExpenses.reduce(
    (sum, item) => sum + Math.abs(item.signedAmount),
    0
  );
  const currentMonthIncome = currentMonthIncomeTransactions.reduce(
    (sum, item) => sum + item.signedAmount,
    0
  );
  const previousMonthSpending = previousMonthExpenses.reduce(
    (sum, item) => sum + Math.abs(item.signedAmount),
    0
  );
  const spendingChangePercent = previousMonthSpending
    ? Math.round(
        ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100
      )
    : currentMonthSpending
    ? 100
    : 0;

  const groupedCategories = currentMonthExpenses.reduce<
    Record<string, ReportCategoryBreakdown>
  >((acc, item) => {
    const name = normalizeCategory(item.transaction.category);

    if (!acc[name]) {
      acc[name] = {
        name,
        amount: 0,
        percentage: 0,
        count: 0,
      };
    }

    acc[name].amount += Math.abs(item.signedAmount);
    acc[name].count += 1;
    acc[name].percentage = currentMonthSpending
      ? Math.round((acc[name].amount / currentMonthSpending) * 100)
      : 0;

    return acc;
  }, {});

  const categoryBreakdown = Object.values(groupedCategories).sort(
    (a, b) => b.amount - a.amount
  );

  const monthlyTrend = getRecentMonths(6).map((month) => {
    const monthKey = getMonthKey(month);
    const monthTransactions = transactions.filter(
      (item) => item.date && getMonthKey(item.date) === monthKey
    );
    const income = monthTransactions
      .filter((item) => item.signedAmount > 0)
      .reduce((sum, item) => sum + item.signedAmount, 0);
    const spending = monthTransactions
      .filter((item) => item.signedAmount < 0)
      .reduce((sum, item) => sum + Math.abs(item.signedAmount), 0);

    return {
      month: getMonthLabel(month),
      income,
      spending,
      net: income - spending,
    };
  });

  const accountActivity = accounts
    .map((account) => {
      const accountTransactions = transactionsByAccountId[account.supabaseItemId] || [];
      const currentMonthAccountTransactions = accountTransactions.filter((transaction) => {
        const date = getTransactionDate(transaction);
        return date && getMonthKey(date) === currentMonthKey;
      });
      const income = currentMonthAccountTransactions
        .map(getSignedAmount)
        .filter((amount) => amount > 0)
        .reduce((sum, amount) => sum + amount, 0);
      const spending = currentMonthAccountTransactions
        .map(getSignedAmount)
        .filter((amount) => amount < 0)
        .reduce((sum, amount) => sum + Math.abs(amount), 0);

      return {
        id: account.supabaseItemId,
        name: account.name || "Bank account",
        bankName: account.bankName || "Connected bank",
        balance: Number(account.currentBalance) || 0,
        income,
        spending,
        transactionCount: currentMonthAccountTransactions.length,
      };
    })
    .sort((a, b) => b.transactionCount - a.transactionCount);

  const largestExpenseItem =
    [...currentMonthExpenses].sort(
      (a, b) => Math.abs(b.signedAmount) - Math.abs(a.signedAmount)
    )[0] || null;
  const topCategory = categoryBreakdown[0] || null;
  const mostActiveAccount = accountActivity[0] || null;
  const averageExpense = currentMonthExpenses.length
    ? currentMonthSpending / currentMonthExpenses.length
    : 0;

  const reportSummary = [
    `This month income: ${currentMonthIncome.toFixed(2)}`,
    `This month spending: ${currentMonthSpending.toFixed(2)}`,
    `Net cash flow: ${(currentMonthIncome - currentMonthSpending).toFixed(2)}`,
    topCategory
      ? `Top category: ${topCategory.name} (${topCategory.percentage}%)`
      : "Top category: not enough spending data",
    largestExpenseItem
      ? `Largest expense: ${largestExpenseItem.transaction.name} (${Math.abs(
          largestExpenseItem.signedAmount
        ).toFixed(2)})`
      : "Largest expense: not enough spending data",
  ];

  return {
    monthLabel: getMonthLabel(currentMonthStart),
    previousMonthLabel: getMonthLabel(previousMonthStart),
    currentMonthIncome,
    currentMonthSpending,
    currentMonthNet: currentMonthIncome - currentMonthSpending,
    previousMonthSpending,
    spendingChangePercent,
    totalCurrentBalance,
    transactionCount: currentMonthTransactions.length,
    averageExpense,
    categoryBreakdown,
    monthlyTrend,
    accountActivity,
    largestExpense: largestExpenseItem
      ? toHighlight(
          largestExpenseItem.transaction,
          largestExpenseItem.accountName
        )
      : null,
    topCategory,
    mostActiveAccount,
    reportSummary,
    assistantQuestion:
      "Can you explain my reports and tell me what I should watch this month?",
  };
};
