"use server";

import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { getAssistantQuestionIntent, includesAny } from "@/lib/assistant-intent";
import { formatAmount, getAccountIdentifier } from "@/lib/utilsz";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type AssistantAccountSummary = {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  currencyCode: string;
};

type AssistantDefaultReceivingAccount = AssistantAccountSummary & {
  shareableId?: string;
};

type AssistantCategorySummary = {
  name: string;
  amount: number;
  percentage: number;
  count: number;
  currencyCode: string;
};

type AssistantTransactionSummary = {
  id: string;
  name: string;
  accountName: string;
  amount: number;
  signedAmount: number;
  category: string;
  date: string;
  currencyCode: string;
};

type AssistantCurrencyTotal = {
  currencyCode: string;
  amount: number;
  count: number;
};

export type AssistantBudget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type AssistantSavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
};

export type AssistantSubscription = {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  frequency: "weekly" | "monthly" | "yearly";
  accountName?: string;
  isPaid?: boolean;
};

export type AssistantPreferences = {
  budgets?: AssistantBudget[];
  savingsGoals?: AssistantSavingsGoal[];
  subscriptions?: AssistantSubscription[];
};

export type AssistantBudgetAnalysis = {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "watch" | "over";
};

export type AssistantSavingsGoalAnalysis = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  targetDate?: string;
};

export type AssistantSubscriptionAnalysis = AssistantSubscription & {
  daysUntilDue: number;
  monthlyAmount: number;
  status: "paid" | "due-soon" | "overdue" | "scheduled";
};

export type AssistantHealthFactor = {
  label: string;
  score: number;
  detail: string;
  status: "good" | "watch" | "risk";
};

export type AssistantHealthInsight = {
  score: number;
  statusLabel: string;
  summary: string;
  factors: AssistantHealthFactor[];
  actionItems: string[];
};

export type FinanceAssistantOverview = {
  userName: string;
  userScope: string;
  accountCount: number;
  totalBalance: number;
  answerMode: "gemini" | "basic";
  accounts: AssistantAccountSummary[];
  defaultReceivingAccount: AssistantDefaultReceivingAccount | null;
  monthSpent: number;
  monthIncome: number;
  projectedMonthSpending: number;
  dailyAverageSpending: number;
  topCategories: AssistantCategorySummary[];
  recentTransactions: AssistantTransactionSummary[];
  monthlyTransferTotals: AssistantCurrencyTotal[];
  latestTransferTransaction: AssistantTransactionSummary | null;
  largestExpense: AssistantTransactionSummary | null;
  budgetAnalyses: AssistantBudgetAnalysis[];
  savingsGoalAnalyses: AssistantSavingsGoalAnalysis[];
  subscriptionAnalyses: AssistantSubscriptionAnalysis[];
  financialHealth: AssistantHealthInsight;
  quickInsights: string[];
  suggestedQuestions: string[];
};

const getSignedAmount = (transaction: Transaction) => {
  if (typeof transaction.signedAmount === "number") return transaction.signedAmount;
  const amount = Math.abs(Number(transaction.amount) || 0);
  return transaction.type === "debit" ? -amount : amount;
};

const getTransactionDate = (transaction: Transaction) => {
  const date = new Date(transaction.date || 0);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const isCurrentMonth = (date: Date, now = new Date()) =>
  date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

const normalizeCategory = (category?: string) =>
  (category || "Uncategorized").replace(/_/g, " ").trim() || "Uncategorized";

const clampScore = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Math.round(value)));

const getHealthFactorStatus = (score: number): AssistantHealthFactor["status"] => {
  if (score >= 75) return "good";
  if (score >= 50) return "watch";
  return "risk";
};

const formatAssistantAmount = (amount: number, currencyCode?: string | null) =>
  formatAmount(amount, currencyCode || "USD");

const getMonthTiming = () => {
  const now = new Date();
  const elapsedDays = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return { elapsedDays, daysInMonth };
};

const buildAssistantContext = (overview: FinanceAssistantOverview) => ({
  userName: overview.userName,
  accountCount: overview.accountCount,
  totalBalance: overview.totalBalance,
  accounts: overview.accounts.map((account) => ({
    name: account.name,
    bankName: account.bankName,
    balance: account.balance,
    currencyCode: account.currencyCode,
  })),
  defaultReceivingAccount: overview.defaultReceivingAccount,
  thisMonth: {
    spent: overview.monthSpent,
    income: overview.monthIncome,
    projectedSpending: overview.projectedMonthSpending,
    dailyAverageSpending: overview.dailyAverageSpending,
  },
  topCategories: overview.topCategories,
  budgets: overview.budgetAnalyses,
  savingsGoals: overview.savingsGoalAnalyses,
  subscriptions: overview.subscriptionAnalyses,
  financialHealth: overview.financialHealth,
  recentTransactions: overview.recentTransactions.map((transaction) => ({
    name: transaction.name,
    accountName: transaction.accountName,
    amount: transaction.amount,
    signedAmount: transaction.signedAmount,
    category: transaction.category,
    date: transaction.date,
    currencyCode: transaction.currencyCode,
  })),
  monthlyTransferTotals: overview.monthlyTransferTotals,
  latestTransferTransaction: overview.latestTransferTransaction,
  largestExpense: overview.largestExpense
    ? {
        name: overview.largestExpense.name,
        amount: overview.largestExpense.amount,
        category: overview.largestExpense.category,
        date: overview.largestExpense.date,
        currencyCode: overview.largestExpense.currencyCode,
      }
    : null,
});

const askGemini = async ({
  question,
  fallbackAnswer,
  overview,
}: {
  question: string;
  fallbackAnswer: string;
  overview: FinanceAssistantOverview;
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are Defiance Finance's finance assistant. Answer using only the provided finance context. Keep answers short, practical, and friendly. Do not invent transactions, balances, budgets, or goals. Treat computedFallbackAnswer as the source of truth for amounts, currencies, counts, and dates. You may rephrase it, but do not contradict or omit its currency information. If the context does not contain enough data, say that clearly. Do not give guaranteed investment, tax, or legal advice. If the user writes Turkish, answer in simple Turkish without Turkish special characters.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: JSON.stringify({
                  question,
                  financeContext: buildAssistantContext(overview),
                  computedFallbackAnswer: fallbackAnswer,
                }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 550,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Gemini assistant request failed:", await response.text());
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    return text || null;
  } catch (error) {
    console.error("Gemini assistant could not answer:", error);
    return null;
  }
};

const mapTransaction = (
  transaction: Transaction,
  accountName: string
): AssistantTransactionSummary => {
  const signedAmount = getSignedAmount(transaction);

  return {
    id: transaction.id,
    name: transaction.name,
    accountName,
    amount: Math.abs(signedAmount),
    signedAmount,
    category: normalizeCategory(transaction.category),
    date: transaction.date || "",
    currencyCode: transaction.currencyCode || "USD",
  };
};

const buildOverview = (
  user: User,
  accounts: Account[],
  transactions: AssistantTransactionSummary[],
  totalBalance: number,
  preferences: AssistantPreferences = {}
): FinanceAssistantOverview => {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const monthTransactions = sortedTransactions.filter((transaction) =>
    isCurrentMonth(new Date(transaction.date || 0))
  );

  const monthExpenses = monthTransactions.filter((transaction) => transaction.signedAmount < 0);
  const monthIncomeTransactions = monthTransactions.filter(
    (transaction) => transaction.signedAmount > 0
  );

  const monthSpent = monthExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthIncome = monthIncomeTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );
  const monthlyTransferTotals = Object.values(
    monthExpenses
      .filter((transaction) => transaction.category.toLowerCase() === "transfer")
      .reduce<Record<string, AssistantCurrencyTotal>>((acc, transaction) => {
        const currencyCode = transaction.currencyCode || "USD";

        if (!acc[currencyCode]) {
          acc[currencyCode] = {
            currencyCode,
            amount: 0,
            count: 0,
          };
        }

        acc[currencyCode].amount += transaction.amount;
        acc[currencyCode].count += 1;
        return acc;
      }, {})
  );

  const groupedCategories = monthExpenses.reduce<Record<string, AssistantCategorySummary>>(
    (acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          name: transaction.category,
          amount: 0,
          percentage: 0,
          count: 0,
          currencyCode: transaction.currencyCode || "USD",
        };
      }

      acc[transaction.category].amount += transaction.amount;
      acc[transaction.category].count += 1;
      acc[transaction.category].percentage = monthSpent
        ? Math.round((acc[transaction.category].amount / monthSpent) * 100)
        : 0;

      return acc;
    },
    {}
  );

  const topCategories = Object.values(groupedCategories)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const { elapsedDays, daysInMonth } = getMonthTiming();
  const dailyAverageSpending = monthSpent / elapsedDays;
  const projectedMonthSpending = dailyAverageSpending * daysInMonth;
  const largestExpense =
    [...monthExpenses].sort((a, b) => b.amount - a.amount)[0] || null;
  const latestTransferTransaction =
    sortedTransactions.find(
      (transaction) => transaction.category.toLowerCase() === "transfer"
    ) || null;
  const topAccount =
    [...accounts].sort((a, b) => b.currentBalance - a.currentBalance)[0] || null;
  const defaultReceivingId =
    (user as any).default_receiving_account_id ||
    (user as any).defaultReceivingAccountId ||
    (user as any).default_account_id ||
    (user as any).defaultAccountId ||
    (user as any).user_metadata?.defaultReceivingAccountId ||
    "";
  const defaultReceivingAccountRaw =
    accounts.find((account) => {
      const accountIds = [
        getAccountIdentifier(account),
        account.supabaseItemId,
        account.shareableId,
        account.id,
      ].map((id) => String(id || ""));

      return defaultReceivingId ? accountIds.includes(String(defaultReceivingId)) : false;
    }) || accounts[0] || null;
  const defaultReceivingAccount = defaultReceivingAccountRaw
    ? {
        id: defaultReceivingAccountRaw.supabaseItemId,
        name: defaultReceivingAccountRaw.name || "Bank account",
        bankName: defaultReceivingAccountRaw.bankName || "Connected bank",
        balance: Number(defaultReceivingAccountRaw.currentBalance) || 0,
        currencyCode: defaultReceivingAccountRaw.currencyCode || "USD",
        shareableId:
          defaultReceivingAccountRaw.shareableId ||
          defaultReceivingAccountRaw.supabaseItemId,
      }
    : null;
  const topCategory = topCategories[0] || null;
  const budgetAnalyses = (preferences.budgets || [])
    .filter((budget) => budget.category && Number(budget.monthlyLimit) > 0)
    .map((budget) => {
      const category = budget.category.trim();
      const categorySpent =
        topCategories.find((item) => item.name.toLowerCase() === category.toLowerCase())
          ?.amount || 0;
      const monthlyLimit = Number(budget.monthlyLimit) || 0;
      const percentage = monthlyLimit
        ? Math.round((categorySpent / monthlyLimit) * 100)
        : 0;

      return {
        id: budget.id,
        category,
        monthlyLimit,
        spent: categorySpent,
        remaining: monthlyLimit - categorySpent,
        percentage,
        status: percentage >= 100 ? "over" : percentage >= 80 ? "watch" : "good",
      } satisfies AssistantBudgetAnalysis;
    })
    .sort((a, b) => b.percentage - a.percentage);

  const savingsGoalAnalyses = (preferences.savingsGoals || [])
    .filter((goal) => goal.name && Number(goal.targetAmount) > 0)
    .map((goal) => {
      const targetAmount = Number(goal.targetAmount) || 0;
      const currentAmount = Math.max(0, Number(goal.currentAmount) || 0);
      const percentage = targetAmount
        ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
        : 0;

      return {
        id: goal.id,
        name: goal.name.trim(),
        targetAmount,
        currentAmount,
        remaining: Math.max(0, targetAmount - currentAmount),
        percentage,
        targetDate: goal.targetDate,
      } satisfies AssistantSavingsGoalAnalysis;
    })
    .sort((a, b) => b.percentage - a.percentage);

  const subscriptionAnalyses = (preferences.subscriptions || [])
    .filter((subscription) => subscription.name && Number(subscription.amount) > 0)
    .map((subscription) => {
      const amount = Number(subscription.amount) || 0;
      const dueDate = new Date(subscription.dueDate || 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Number.isNaN(dueDate.getTime())
        ? 9999
        : Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
      const monthlyAmount =
        subscription.frequency === "weekly"
          ? amount * 4.33
          : subscription.frequency === "yearly"
          ? amount / 12
          : amount;
      const status = subscription.isPaid
        ? "paid"
        : daysUntilDue < 0
        ? "overdue"
        : daysUntilDue <= 7
        ? "due-soon"
        : "scheduled";

      return {
        ...subscription,
        amount,
        daysUntilDue,
        monthlyAmount,
        status,
      } satisfies AssistantSubscriptionAnalysis;
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const cashFlowScore = monthIncome
    ? clampScore(((monthIncome - monthSpent) / Math.max(monthIncome, 1)) * 100 + 55)
    : monthSpent
    ? 35
    : 60;
  const budgetScore = budgetAnalyses.length
    ? budgetAnalyses.reduce((sum, budget) => {
        if (budget.status === "over") return sum + 30;
        if (budget.status === "watch") return sum + 60;
        return sum + 90;
      }, 0) / budgetAnalyses.length
    : 65;
  const goalScore = savingsGoalAnalyses.length
    ? savingsGoalAnalyses.reduce((sum, goal) => {
        if (goal.percentage >= 100) return sum + 100;
        if (goal.percentage >= 50) return sum + 80;
        if (goal.percentage > 0) return sum + 60;
        return sum + 45;
      }, 0) / savingsGoalAnalyses.length
    : 60;
  const balanceScore = totalBalance > 0 ? 80 : 45;
  const activityScore =
    monthTransactions.length >= 10 ? 85 : monthTransactions.length >= 4 ? 70 : 55;
  const healthFactors: AssistantHealthFactor[] = [
    {
      label: "Cash flow",
      score: clampScore(cashFlowScore),
      detail:
        monthIncome - monthSpent >= 0
          ? "Income is covering this month's spending."
          : "Spending is higher than income this month.",
      status: getHealthFactorStatus(cashFlowScore),
    },
    {
      label: "Budget control",
      score: clampScore(budgetScore),
      detail: budgetAnalyses.length
        ? `${budgetAnalyses.filter((budget) => budget.status !== "good").length} budget categories need attention.`
        : "No category budget has been added yet.",
      status: getHealthFactorStatus(budgetScore),
    },
    {
      label: "Savings goals",
      score: clampScore(goalScore),
      detail: savingsGoalAnalyses.length
        ? `${savingsGoalAnalyses.filter((goal) => goal.percentage < 50).length} goals need more progress.`
        : "No savings goal has been added yet.",
      status: getHealthFactorStatus(goalScore),
    },
    {
      label: "Account balance",
      score: clampScore(balanceScore),
      detail:
        totalBalance > 0
          ? "Total account balance is positive."
          : "Total account balance needs attention.",
      status: getHealthFactorStatus(balanceScore),
    },
    {
      label: "Activity",
      score: clampScore(activityScore),
      detail: `${monthTransactions.length} transactions are tracked this month.`,
      status: getHealthFactorStatus(activityScore),
    },
  ];
  const healthScore = clampScore(
    healthFactors.reduce((sum, factor) => sum + factor.score, 0) / healthFactors.length
  );
  const financialHealth: AssistantHealthInsight = {
    score: healthScore,
    statusLabel:
      healthScore >= 78 ? "Strong" : healthScore >= 58 ? "Steady" : "Needs attention",
    summary:
      healthScore >= 78
        ? "Your financial health looks strong this month."
        : healthScore >= 58
        ? "Your financial health is steady, with a few areas to watch."
        : "Your financial health needs attention in a few places.",
    factors: healthFactors,
    actionItems: [
      monthIncome - monthSpent < 0
        ? "Reduce spending or increase income to bring cash flow above zero."
        : "Keep cash flow positive.",
      budgetAnalyses.some((budget) => budget.status !== "good")
        ? "Review the budget categories that are close to or over the limit."
        : "Keep category budgets updated.",
      savingsGoalAnalyses.length
        ? "Keep adding to savings goals each week."
        : "Add a savings goal to make the score more useful.",
      totalBalance > 0
        ? "Protect the positive account balance."
        : "Focus on improving account balance first.",
    ],
  };

  const topBudgetRisk = budgetAnalyses[0] || null;
  const topSavingsGoal = savingsGoalAnalyses[0] || null;
  const upcomingSubscription =
    subscriptionAnalyses.find((subscription) => subscription.status !== "paid") ||
    subscriptionAnalyses[0];

  const quickInsights = [
    topCategory
      ? `Top spending category this month is ${topCategory.name} with ${formatAssistantAmount(
          topCategory.amount,
          topCategory.currencyCode
        )}.`
      : "There is no spending data for this month yet.",
    `Projected spending for this month is about ${formatAmount(projectedMonthSpending)}.`,
    topAccount
      ? `Highest account balance is in ${topAccount.name || "one account"} with ${formatAssistantAmount(
          topAccount.currentBalance,
          topAccount.currencyCode
        )}.`
      : "No bank account balance is available yet.",
    topBudgetRisk
      ? `${topBudgetRisk.category} budget is ${topBudgetRisk.percentage}% used.`
      : "No category budget has been added yet.",
    topSavingsGoal
      ? `${topSavingsGoal.name} goal is ${topSavingsGoal.percentage}% complete.`
      : "No savings goal has been added yet.",
    upcomingSubscription
      ? `${upcomingSubscription.name} is due in ${upcomingSubscription.daysUntilDue} days.`
      : "No recurring bill has been added yet.",
    defaultReceivingAccount
      ? `Default receiving account is ${defaultReceivingAccount.name}.`
      : "No default receiving account is selected yet.",
  ];

  return {
    userName: user.firstName || user.email,
    userScope: user.email,
    accountCount: accounts.length,
    totalBalance,
    answerMode: process.env.GEMINI_API_KEY ? "gemini" : "basic",
    accounts: accounts.map((account) => ({
      id: account.supabaseItemId,
      name: account.name || "Bank account",
      bankName: account.bankName || "Connected bank",
      balance: Number(account.currentBalance) || 0,
      currencyCode: account.currencyCode || "USD",
    })),
    defaultReceivingAccount,
    monthSpent,
    monthIncome,
    projectedMonthSpending,
    dailyAverageSpending,
    topCategories,
    recentTransactions: sortedTransactions.slice(0, 5),
    monthlyTransferTotals,
    latestTransferTransaction,
    largestExpense,
    budgetAnalyses,
    savingsGoalAnalyses,
    subscriptionAnalyses,
    financialHealth,
    quickInsights,
    suggestedQuestions: [
      "Can you explain my financial health score?",
      "What did I spend the most on this month?",
      "What are my recent transactions?",
      "Which account has the highest balance?",
      "Will my spending be high this month?",
      "How are my budgets doing?",
      "How close am I to my savings goals?",
      "Which bills are coming soon?",
      "What is my default receiving account?",
    ],
  };
};

const getOverviewData = async (preferences: AssistantPreferences = {}) => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const accountsResult = await getAccounts({ email: loggedIn.email });
  const accounts = accountsResult?.data || [];

  const accountDetails = await Promise.all(
    accounts.map((account: Account) =>
      getAccount({
        supabaseItemId: account.supabaseItemId,
        connectionId: account.connectionId,
        account,
      })
    )
  );

  const transactions = accounts.flatMap((account: Account, index: number) => {
    const accountTransactions = accountDetails[index]?.transactions || [];
    return accountTransactions.map((transaction: Transaction) =>
      mapTransaction(transaction, account.name || "Bank account")
    );
  });

  return buildOverview(
    loggedIn,
    accounts,
    transactions,
    Number(accountsResult?.totalCurrentBalance) || 0,
    preferences
  );
};

export const getFinanceAssistantOverview = async () => {
  const overview = await getOverviewData();
  return JSON.parse(JSON.stringify(overview));
};

export const askFinanceAssistant = async (
  question: string,
  preferences: AssistantPreferences = {}
) => {
  const overview = await getOverviewData(preferences);
  if (!overview) {
    return {
      answer: "Please sign in before using the finance assistant.",
    };
  }

  const {
    normalizedQuestion,
    isTurkish,
    asksAboutLatestTransfer,
    asksAboutTransferTotal,
    asksAboutCurrency,
  } = getAssistantQuestionIntent(question);
  const topCategory = overview.topCategories[0];
  const largestExpense = overview.largestExpense;
  const topAccount = [...overview.accounts].sort((a, b) => b.balance - a.balance)[0];

  let answer: string;

  if (!normalizedQuestion) {
    answer = isTurkish
      ? "Bir soru yazarsan harcamalarini, hesaplarini veya son islemlerini analiz edebilirim."
      : "Ask me about your spending, accounts, or recent transactions.";
  } else if (asksAboutLatestTransfer) {
    const latestTransfer = overview.latestTransferTransaction;

    answer = latestTransfer
      ? isTurkish
        ? `Son transfer islemin ${latestTransfer.name}: ${formatAssistantAmount(
            latestTransfer.amount,
            latestTransfer.currencyCode
          )}, ${latestTransfer.accountName} hesabi, tarih ${latestTransfer.date || "bilinmiyor"}.`
        : `Your latest transfer is ${latestTransfer.name}: ${formatAssistantAmount(
            latestTransfer.amount,
            latestTransfer.currencyCode
          )}, account ${latestTransfer.accountName}, date ${latestTransfer.date || "unknown"}.`
      : isTurkish
      ? "Son transfer islemi bulunmuyor."
      : "No transfer transaction was found.";
  } else if (asksAboutTransferTotal || asksAboutCurrency) {
    const transferTotalText = overview.monthlyTransferTotals
      .map((total) => formatAssistantAmount(total.amount, total.currencyCode))
      .join(", ");

    answer = overview.monthlyTransferTotals.length
      ? isTurkish
        ? `Bu ay giden transfer toplamin ${transferTotalText}. Para birimi islem kaydindaki currency alanindan geliyor.`
        : `Your outgoing transfer total this month is ${transferTotalText}. The currency comes from each transaction's currency field.`
      : isTurkish
      ? "Bu ay giden transfer kaydi bulunmuyor."
      : "No outgoing transfer transactions were found for this month.";
  } else if (
    includesAny(normalizedQuestion, [
      "recent",
      "last transaction",
      "son",
      "islem",
      "hareket",
    ])
  ) {
    const recentText = overview.recentTransactions
      .map(
        (transaction) =>
          `${transaction.name} (${formatAssistantAmount(
            transaction.amount,
            transaction.currencyCode
          )}, ${transaction.category})`
      )
      .join(", ");

    answer = isTurkish
      ? `Son islemlerin: ${recentText || "henuz islem bulunmuyor"}.`
      : `Your recent transactions are: ${recentText || "no transactions found yet"}.`;
  } else if (
    includesAny(normalizedQuestion, [
      "default receiving",
      "receiving account",
      "default account",
      "transfer default",
      "default receiver",
      "varsayilan hesap",
      "alici hesap",
      "transfer hesabi",
    ])
  ) {
    const defaultAccount = overview.defaultReceivingAccount;

    answer = defaultAccount
      ? isTurkish
        ? `Varsayilan alici hesabin ${defaultAccount.name}. Bakiye ${formatAssistantAmount(
            defaultAccount.balance,
            defaultAccount.currencyCode
          )}. Hesap ID: ${defaultAccount.shareableId || defaultAccount.id}.`
        : `Your default receiving account is ${defaultAccount.name}. Balance is ${formatAssistantAmount(
            defaultAccount.balance,
            defaultAccount.currencyCode
          )}. Account ID: ${defaultAccount.shareableId || defaultAccount.id}.`
      : isTurkish
      ? "Varsayilan alici hesap secilmemis."
      : "No default receiving account is selected yet.";
  } else if (
    includesAny(normalizedQuestion, [
      "financial health",
      "health score",
      "explain score",
      "score",
      "improve first",
      "insight",
      "skor",
      "finansal saglik",
      "iyilestir",
    ])
  ) {
    const health = overview.financialHealth;
    const factorText = health.factors
      .map((factor) => `${factor.label}: ${factor.score}/100 - ${factor.detail}`)
      .join("; ");
    const weakestFactor = [...health.factors].sort((a, b) => a.score - b.score)[0];

    answer = isTurkish
      ? `Finansal saglik skorun ${health.score}/100 ve durumun ${health.statusLabel}. ${health.summary} En zayif alan ${weakestFactor.label}: ${weakestFactor.detail} Ilk adim: ${health.actionItems[0]}`
      : `Your financial health score is ${health.score}/100, which is ${health.statusLabel}. ${health.summary} Score details: ${factorText}. First improvement: ${health.actionItems[0]}`;
  } else if (
    includesAny(normalizedQuestion, [
      "account",
      "balance",
      "hesap",
      "bakiye",
      "para kald",
      "money left",
    ])
  ) {
    const accountsText = overview.accounts
      .map((account) => `${account.name}: ${formatAssistantAmount(account.balance, account.currencyCode)}`)
      .join(", ");

    answer = isTurkish
      ? `${topAccount?.name || "Bir hesabinda"} en yuksek bakiye gorunuyor: ${formatAssistantAmount(
          topAccount?.balance || 0,
          topAccount?.currencyCode
        )}. Hesap ozeti: ${accountsText}.`
      : `${topAccount?.name || "One account"} has the highest balance: ${formatAssistantAmount(
          topAccount?.balance || 0,
          topAccount?.currencyCode
        )}. Account summary: ${accountsText}.`;
  } else if (
    includesAny(normalizedQuestion, [
      "budget",
      "limit",
      "risk",
      "butce",
      "asar",
      "high",
      "budgets",
    ])
  ) {
    const budgetText = overview.budgetAnalyses
      .map(
        (budget) =>
          `${budget.category}: ${budget.percentage}% used, ${formatAmount(
            Math.max(0, budget.remaining)
          )} remaining`
      )
      .join("; ");

    answer = overview.budgetAnalyses.length
      ? isTurkish
        ? `Butce durumun: ${budgetText}. Bu ay toplam ${formatAmount(
            overview.monthSpent
          )} harcadin ve ay sonu tahmini harcaman ${formatAmount(
            overview.projectedMonthSpending
          )} olabilir.`
        : `Budget status: ${budgetText}. You have spent ${formatAmount(
            overview.monthSpent
          )} this month, and projected month-end spending is ${formatAmount(
            overview.projectedMonthSpending
          )}.`
      : isTurkish
      ? `Bu ay simdiye kadar ${formatAmount(
          overview.monthSpent
        )} harcadin. Bu hizla devam edersen ay sonu tahmini harcaman yaklasik ${formatAmount(
          overview.projectedMonthSpending
        )} olabilir. Henuz kayitli kategori limiti yok.`
      : `You have spent ${formatAmount(
          overview.monthSpent
        )} so far this month. Projected month-end spending is about ${formatAmount(
          overview.projectedMonthSpending
        )}. No category budget has been added yet.`;
  } else if (
    includesAny(normalizedQuestion, [
      "bill",
      "bills",
      "subscription",
      "subscriptions",
      "recurring",
      "due",
      "fatura",
      "abonelik",
    ])
  ) {
    const upcomingBills = overview.subscriptionAnalyses
      .filter((subscription) => subscription.status !== "paid")
      .slice(0, 4);
    const monthlyFixedCost = overview.subscriptionAnalyses.reduce(
      (sum, subscription) => sum + subscription.monthlyAmount,
      0
    );
    const billsText = upcomingBills
      .map(
        (subscription) =>
          `${subscription.name}: ${formatAmount(
            subscription.amount
          )}, due in ${subscription.daysUntilDue} days`
      )
      .join("; ");

    answer = overview.subscriptionAnalyses.length
      ? isTurkish
        ? `Yaklasan faturalarin: ${billsText || "odenmemis fatura yok"}. Aylik sabit gider tahmini ${formatAmount(
            monthlyFixedCost
          )}.`
        : `Upcoming bills: ${billsText || "no unpaid bills right now"}. Estimated monthly fixed cost is ${formatAmount(
            monthlyFixedCost
          )}.`
      : isTurkish
      ? "Henuz kayitli fatura veya abonelik yok."
      : "No recurring bills or subscriptions have been added yet.";
  } else if (
    includesAny(normalizedQuestion, [
      "most",
      "category",
      "spend",
      "spent",
      "en cok",
      "kategori",
      "harca",
    ])
  ) {
    answer = topCategory
      ? isTurkish
        ? `Bu ay en yuksek harcama kategorin ${topCategory.name}. Bu kategoride ${formatAssistantAmount(
            topCategory.amount,
            topCategory.currencyCode
          )} harcadin ve bu, aylik harcamalarinin yaklasik %${topCategory.percentage} kismi.`
        : `Your top spending category this month is ${topCategory.name}. You spent ${formatAssistantAmount(
            topCategory.amount,
            topCategory.currencyCode
          )} there, which is about ${topCategory.percentage}% of this month's spending.`
      : isTurkish
      ? "Bu ay icin kategori bazli harcama bulunmuyor."
      : "There is no category spending data for this month yet.";
  } else if (
    includesAny(normalizedQuestion, ["save", "saving", "tasarruf", "oner"])
  ) {
    const goal = overview.savingsGoalAnalyses[0];

    answer = goal
      ? isTurkish
        ? `${goal.name} hedefin %${goal.percentage} tamamlandi. Hedefe ulasmak icin ${formatAmount(
            goal.remaining
          )} daha gerekiyor. ${
            topCategory
              ? `${topCategory.name} harcamalarina limit koymak bu hedefe daha hizli yaklasmana yardimci olabilir.`
              : ""
          }`
        : `${goal.name} is ${goal.percentage}% complete. You need ${formatAmount(
            goal.remaining
          )} more to reach it. ${
            topCategory
              ? `Setting a limit for ${topCategory.name} could help you move toward this goal faster.`
              : ""
          }`
      : topCategory
      ? isTurkish
        ? `${topCategory.name} bu ay en buyuk harcama alanin oldugu icin once bu kategoriye haftalik limit koymak mantikli olabilir. Gunluk ortalama harcaman su an ${formatAmount(
            overview.dailyAverageSpending
          )}.`
        : `${topCategory.name} is your biggest spending area this month, so setting a weekly limit there could help. Your current daily average spending is ${formatAmount(
            overview.dailyAverageSpending
          )}.`
      : isTurkish
      ? "Tasarruf onerisi verebilmem icin bu ay biraz daha harcama verisine ihtiyac var."
      : "I need more spending data from this month before giving a useful saving suggestion.";
  } else {
    answer = isTurkish
      ? `Genel ozet: ${overview.accountCount} hesabin var, toplam bakiye ${formatAmount(
          overview.totalBalance
        )}. Bu ay ${formatAmount(overview.monthSpent)} harcama ve ${formatAmount(
          overview.monthIncome
        )} gelir gorunuyor.${
          largestExpense
            ? ` En buyuk harcaman ${largestExpense.name} icin ${formatAssistantAmount(
                largestExpense.amount,
                largestExpense.currencyCode
              )}.`
            : ""
        }`
      : `Quick summary: you have ${overview.accountCount} accounts with ${formatAmount(
          overview.totalBalance
        )} total balance. This month shows ${formatAmount(
          overview.monthSpent
        )} spending and ${formatAmount(overview.monthIncome)} income.${
          largestExpense
            ? ` Your largest expense is ${largestExpense.name} for ${formatAssistantAmount(
                largestExpense.amount,
                largestExpense.currencyCode
              )}.`
            : ""
        }`;
  }

  const geminiAnswer = await askGemini({
    question,
    fallbackAnswer: answer,
    overview,
  });

  return JSON.parse(
    JSON.stringify({
      answer: geminiAnswer || answer,
      answerSource: geminiAnswer ? "gemini" : "computed",
      overview,
    })
  );
};
