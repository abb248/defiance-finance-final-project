export const PLANNER_STORAGE_KEY = "defiance-finance-planner";

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

export type StoredSubscription = {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  frequency: "weekly" | "monthly" | "yearly";
  accountName?: string;
  isPaid?: boolean;
};

export type StoredPlannerState = {
  budgets: StoredBudget[];
  savingsGoals: StoredSavingsGoal[];
  subscriptions: StoredSubscription[];
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

export type SavingsGoalAnalysis = StoredSavingsGoal & {
  remaining: number;
  percentage: number;
  daysLeft: number | null;
  monthlyNeeded: number;
  weeklyNeeded: number;
  status: "completed" | "on-track" | "behind" | "no-date";
};

export type SubscriptionAnalysis = StoredSubscription & {
  daysUntilDue: number;
  monthlyAmount: number;
  yearlyAmount: number;
  status: "paid" | "due-soon" | "overdue" | "scheduled";
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

const getDaysLeft = (targetDate?: string) => {
  if (!targetDate) return null;

  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};

export const analyzeSavingsGoals = (
  goals: StoredSavingsGoal[] = []
): SavingsGoalAnalysis[] =>
  goals
    .filter((goal) => goal.name && Number(goal.targetAmount) > 0)
    .map((goal) => {
      const targetAmount = Number(goal.targetAmount) || 0;
      const currentAmount = Math.max(0, Number(goal.currentAmount) || 0);
      const remaining = Math.max(0, targetAmount - currentAmount);
      const percentage = targetAmount
        ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
        : 0;
      const daysLeft = getDaysLeft(goal.targetDate);
      const weeksLeft = daysLeft !== null ? Math.max(daysLeft / 7, 1) : 0;
      const monthsLeft = daysLeft !== null ? Math.max(daysLeft / 30.44, 1) : 0;
      const weeklyNeeded = daysLeft !== null && remaining > 0 ? remaining / weeksLeft : 0;
      const monthlyNeeded = daysLeft !== null && remaining > 0 ? remaining / monthsLeft : 0;
      const expectedProgress =
        daysLeft !== null && goal.targetDate
          ? (() => {
              const createdAt = new Date(Number(goal.id) || Date.now());
              const target = new Date(goal.targetDate);
              if (
                Number.isNaN(createdAt.getTime()) ||
                Number.isNaN(target.getTime()) ||
                target.getTime() <= createdAt.getTime()
              ) {
                return null;
              }

              const elapsed = Date.now() - createdAt.getTime();
              const total = target.getTime() - createdAt.getTime();
              return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
            })()
          : null;

      let status: SavingsGoalAnalysis["status"] = "no-date";
      if (percentage >= 100) {
        status = "completed";
      } else if (daysLeft !== null && daysLeft < 0) {
        status = "behind";
      } else if (expectedProgress !== null) {
        status = percentage + 5 >= expectedProgress ? "on-track" : "behind";
      } else if (daysLeft !== null) {
        status = "on-track";
      }

      return {
        ...goal,
        name: goal.name.trim(),
        targetAmount,
        currentAmount,
        remaining,
        percentage,
        daysLeft,
        monthlyNeeded,
        weeklyNeeded,
        status,
      };
    })
    .sort((a, b) => {
      const statusWeight = { behind: 0, "on-track": 1, "no-date": 2, completed: 3 };
      return statusWeight[a.status] - statusWeight[b.status] || b.remaining - a.remaining;
    });

const getDateStart = (dateValue: string) => {
  const date = new Date(dateValue || 0);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getSubscriptionMonthlyAmount = (subscription: StoredSubscription) => {
  const amount = Number(subscription.amount) || 0;

  if (subscription.frequency === "weekly") return amount * 4.33;
  if (subscription.frequency === "yearly") return amount / 12;
  return amount;
};

export const analyzeSubscriptions = (
  subscriptions: StoredSubscription[] = []
): SubscriptionAnalysis[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return subscriptions
    .filter((subscription) => subscription.name && Number(subscription.amount) > 0)
    .map((subscription) => {
      const dueDate = getDateStart(subscription.dueDate);
      const daysUntilDue = dueDate
        ? Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000)
        : 9999;
      const monthlyAmount = getSubscriptionMonthlyAmount(subscription);
      const yearlyAmount = monthlyAmount * 12;
      let status: SubscriptionAnalysis["status"] = "scheduled";

      if (subscription.isPaid) {
        status = "paid";
      } else if (daysUntilDue < 0) {
        status = "overdue";
      } else if (daysUntilDue <= 7) {
        status = "due-soon";
      }

      return {
        ...subscription,
        amount: Number(subscription.amount) || 0,
        category: normalizeBudgetCategory(subscription.category),
        daysUntilDue,
        monthlyAmount,
        yearlyAmount,
        status,
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
};

export const getPlannerStateFromStorage = (): StoredPlannerState => {
  if (typeof window === "undefined") {
    return { budgets: [], savingsGoals: [], subscriptions: [] };
  }

  try {
    const storedPlanner = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!storedPlanner) return { budgets: [], savingsGoals: [], subscriptions: [] };

    const parsed = JSON.parse(storedPlanner);
    return {
      budgets: Array.isArray(parsed?.budgets) ? parsed.budgets : [],
      savingsGoals: Array.isArray(parsed?.savingsGoals) ? parsed.savingsGoals : [],
      subscriptions: Array.isArray(parsed?.subscriptions) ? parsed.subscriptions : [],
    };
  } catch {
    return { budgets: [], savingsGoals: [], subscriptions: [] };
  }
};

export const savePlannerStateToStorage = (plannerState: StoredPlannerState) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerState));
};
