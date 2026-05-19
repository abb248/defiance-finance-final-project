export const PLANNER_STORAGE_KEY = "spendwise-finance-planner";

export type StoredBudget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type StoredSavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
};

export type StoredPlannerState = {
  budgets: StoredBudget[];
  savingsGoals: StoredSavingsGoal[];
};

export type BudgetCategorySpending = {
  name: string;
  amount: number;
  percentage: number;
  count: number;
};

export type BudgetAnalysis = StoredBudget & {
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "watch" | "over";
  suggestedLimit: number;
};

export const createPlannerId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());

export const normalizeBudgetCategory = (category?: string) =>
  (category || "Uncategorized").replace(/_/g, " ").trim() || "Uncategorized";

export const getBudgetSignedAmount = (transaction: Transaction) => {
  if (typeof transaction.signedAmount === "number") return transaction.signedAmount;

  const amount = Math.abs(Number(transaction.amount) || 0);
  return transaction.type === "debit" ? -amount : amount;
};

const isCurrentMonth = (date?: string) => {
  const parsedDate = new Date(date || 0);
  if (Number.isNaN(parsedDate.getTime())) return false;

  const now = new Date();
  return (
    parsedDate.getFullYear() === now.getFullYear() &&
    parsedDate.getMonth() === now.getMonth()
  );
};

const getSuggestedLimit = (spent: number, currentLimit = 0) => {
  const baseline = currentLimit > 0 ? Math.max(spent, currentLimit) : spent;
  if (!baseline) return 0;

  return Math.ceil((baseline * 1.12) / 50) * 50;
};

export const getCurrentMonthCategorySpending = (
  transactions: Transaction[] = []
) => {
  const spendingTransactions = transactions.filter(
    (transaction) => getBudgetSignedAmount(transaction) < 0 && isCurrentMonth(transaction.date)
  );

  const totalSpent = spendingTransactions.reduce(
    (sum, transaction) => sum + Math.abs(getBudgetSignedAmount(transaction)),
    0
  );

  const grouped = spendingTransactions.reduce<Record<string, BudgetCategorySpending>>(
    (acc, transaction) => {
      const name = normalizeBudgetCategory(transaction.category);
      const amount = Math.abs(getBudgetSignedAmount(transaction));

      if (!acc[name]) {
        acc[name] = {
          name,
          amount: 0,
          percentage: 0,
          count: 0,
        };
      }

      acc[name].amount += amount;
      acc[name].count += 1;
      acc[name].percentage = totalSpent
        ? Math.round((acc[name].amount / totalSpent) * 100)
        : 0;

      return acc;
    },
    {}
  );

  return Object.values(grouped).sort((a, b) => b.amount - a.amount);
};

export const getBudgetCategoryOptions = (
  transactions: Transaction[] = [],
  extraCategories: string[] = []
) => {
  const currentMonthCategories = getCurrentMonthCategorySpending(transactions).map(
    (category) => category.name
  );

  return Array.from(
    new Set(
      [
        ...currentMonthCategories,
        ...extraCategories,
        "Food and Drink",
        "Shopping",
        "Payment",
        "Transfer",
        "Travel",
        "Bank Fees",
      ].map(normalizeBudgetCategory)
    )
  ).sort((a, b) => a.localeCompare(b));
};

export const analyzeBudgetsFromCategorySpending = (
  budgets: StoredBudget[] = [],
  categorySpending: BudgetCategorySpending[] = []
) =>
  budgets
    .filter((budget) => budget.category && Number(budget.monthlyLimit) > 0)
    .map((budget) => {
      const category = normalizeBudgetCategory(budget.category);
      const spent =
        categorySpending.find(
          (item) => item.name.toLowerCase() === category.toLowerCase()
        )?.amount || 0;
      const monthlyLimit = Number(budget.monthlyLimit) || 0;
      const percentage = monthlyLimit ? Math.round((spent / monthlyLimit) * 100) : 0;

      return {
        ...budget,
        category,
        monthlyLimit,
        spent,
        remaining: monthlyLimit - spent,
        percentage,
        status: percentage >= 100 ? "over" : percentage >= 80 ? "watch" : "good",
        suggestedLimit: getSuggestedLimit(spent, monthlyLimit),
      } satisfies BudgetAnalysis;
    })
    .sort((a, b) => b.percentage - a.percentage);

export const analyzeBudgetsFromTransactions = (
  budgets: StoredBudget[] = [],
  transactions: Transaction[] = []
) => analyzeBudgetsFromCategorySpending(budgets, getCurrentMonthCategorySpending(transactions));

export const getPlannerStateFromStorage = (): StoredPlannerState => {
  if (typeof window === "undefined") {
    return { budgets: [], savingsGoals: [] };
  }

  try {
    const storedPlanner = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!storedPlanner) return { budgets: [], savingsGoals: [] };

    const parsed = JSON.parse(storedPlanner);
    return {
      budgets: Array.isArray(parsed?.budgets) ? parsed.budgets : [],
      savingsGoals: Array.isArray(parsed?.savingsGoals) ? parsed.savingsGoals : [],
    };
  } catch {
    return { budgets: [], savingsGoals: [] };
  }
};

export const savePlannerStateToStorage = (plannerState: StoredPlannerState) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerState));
};
