"use server";

import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { formatAmount } from "@/lib/utilsz";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type AssistantAccountSummary = {
  id: string;
  name: string;
  bankName: string;
  balance: number;
};

type AssistantCategorySummary = {
  name: string;
  amount: number;
  percentage: number;
  count: number;
};

type AssistantTransactionSummary = {
  id: string;
  name: string;
  accountName: string;
  amount: number;
  signedAmount: number;
  category: string;
  date: string;
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

export type AssistantPreferences = {
  budgets?: AssistantBudget[];
  savingsGoals?: AssistantSavingsGoal[];
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

export type FinanceAssistantOverview = {
  userName: string;
  accountCount: number;
  totalBalance: number;
  accounts: AssistantAccountSummary[];
  monthSpent: number;
  monthIncome: number;
  projectedMonthSpending: number;
  dailyAverageSpending: number;
  topCategories: AssistantCategorySummary[];
  recentTransactions: AssistantTransactionSummary[];
  largestExpense: AssistantTransactionSummary | null;
  budgetAnalyses: AssistantBudgetAnalysis[];
  savingsGoalAnalyses: AssistantSavingsGoalAnalysis[];
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

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const detectTurkish = (question: string) =>
  includesAny(question.toLowerCase(), [
    "bu ay",
    "butce",
    "harca",
    "hesap",
    "bakiye",
    "islem",
    "tasarruf",
  ]);

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
  })),
  thisMonth: {
    spent: overview.monthSpent,
    income: overview.monthIncome,
    projectedSpending: overview.projectedMonthSpending,
    dailyAverageSpending: overview.dailyAverageSpending,
  },
  topCategories: overview.topCategories,
  budgets: overview.budgetAnalyses,
  savingsGoals: overview.savingsGoalAnalyses,
  recentTransactions: overview.recentTransactions.map((transaction) => ({
    name: transaction.name,
    accountName: transaction.accountName,
    amount: transaction.amount,
    signedAmount: transaction.signedAmount,
    category: transaction.category,
    date: transaction.date,
  })),
  largestExpense: overview.largestExpense
    ? {
        name: overview.largestExpense.name,
        amount: overview.largestExpense.amount,
        category: overview.largestExpense.category,
        date: overview.largestExpense.date,
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
                "You are SpendWise's finance assistant. Answer using only the provided finance context. Keep answers short, practical, and friendly. Do not invent transactions, balances, budgets, or goals. If the context does not contain enough data, say that clearly. Do not give guaranteed investment, tax, or legal advice. If the user writes Turkish, answer in simple Turkish without Turkish special characters.",
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

  const groupedCategories = monthExpenses.reduce<Record<string, AssistantCategorySummary>>(
    (acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = {
          name: transaction.category,
          amount: 0,
          percentage: 0,
          count: 0,
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
  const topAccount =
    [...accounts].sort((a, b) => b.currentBalance - a.currentBalance)[0] || null;
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

  const topBudgetRisk = budgetAnalyses[0] || null;
  const topSavingsGoal = savingsGoalAnalyses[0] || null;

  const quickInsights = [
    topCategory
      ? `Top spending category this month is ${topCategory.name} with ${formatAmount(
          topCategory.amount
        )}.`
      : "There is no spending data for this month yet.",
    `Projected spending for this month is about ${formatAmount(projectedMonthSpending)}.`,
    topAccount
      ? `Highest account balance is in ${topAccount.name || "one account"} with ${formatAmount(
          topAccount.currentBalance
        )}.`
      : "No bank account balance is available yet.",
    topBudgetRisk
      ? `${topBudgetRisk.category} budget is ${topBudgetRisk.percentage}% used.`
      : "No category budget has been added yet.",
    topSavingsGoal
      ? `${topSavingsGoal.name} goal is ${topSavingsGoal.percentage}% complete.`
      : "No savings goal has been added yet.",
  ];

  return {
    userName: user.firstName || user.email,
    accountCount: accounts.length,
    totalBalance,
    accounts: accounts.map((account) => ({
      id: account.supabaseItemId,
      name: account.name || "Bank account",
      bankName: account.bankName || "Connected bank",
      balance: Number(account.currentBalance) || 0,
    })),
    monthSpent,
    monthIncome,
    projectedMonthSpending,
    dailyAverageSpending,
    topCategories,
    recentTransactions: sortedTransactions.slice(0, 5),
    largestExpense,
    budgetAnalyses,
    savingsGoalAnalyses,
    quickInsights,
    suggestedQuestions: [
      "What did I spend the most on this month?",
      "What are my recent transactions?",
      "Which account has the highest balance?",
      "Will my spending be high this month?",
      "How are my budgets doing?",
      "How close am I to my savings goals?",
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

  const normalizedQuestion = question.trim().toLowerCase();
  const isTurkish = detectTurkish(normalizedQuestion);
  const topCategory = overview.topCategories[0];
  const largestExpense = overview.largestExpense;
  const topAccount = [...overview.accounts].sort((a, b) => b.balance - a.balance)[0];

  let answer: string;

  if (!normalizedQuestion) {
    answer = isTurkish
      ? "Bir soru yazarsan harcamalarini, hesaplarini veya son islemlerini analiz edebilirim."
      : "Ask me about your spending, accounts, or recent transactions.";
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
          `${transaction.name} (${formatAmount(transaction.amount)}, ${transaction.category})`
      )
      .join(", ");

    answer = isTurkish
      ? `Son islemlerin: ${recentText || "henuz islem bulunmuyor"}.`
      : `Your recent transactions are: ${recentText || "no transactions found yet"}.`;
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
      .map((account) => `${account.name}: ${formatAmount(account.balance)}`)
      .join(", ");

    answer = isTurkish
      ? `${topAccount?.name || "Bir hesabinda"} en yuksek bakiye gorunuyor: ${formatAmount(
          topAccount?.balance || 0
        )}. Hesap ozeti: ${accountsText}.`
      : `${topAccount?.name || "One account"} has the highest balance: ${formatAmount(
          topAccount?.balance || 0
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
        ? `Bu ay en yuksek harcama kategorin ${topCategory.name}. Bu kategoride ${formatAmount(
            topCategory.amount
          )} harcadin ve bu, aylik harcamalarinin yaklasik %${topCategory.percentage} kismi.`
        : `Your top spending category this month is ${topCategory.name}. You spent ${formatAmount(
            topCategory.amount
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
            ? ` En buyuk harcaman ${largestExpense.name} icin ${formatAmount(
                largestExpense.amount
              )}.`
            : ""
        }`
      : `Quick summary: you have ${overview.accountCount} accounts with ${formatAmount(
          overview.totalBalance
        )} total balance. This month shows ${formatAmount(
          overview.monthSpent
        )} spending and ${formatAmount(overview.monthIncome)} income.${
          largestExpense
            ? ` Your largest expense is ${largestExpense.name} for ${formatAmount(
                largestExpense.amount
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
