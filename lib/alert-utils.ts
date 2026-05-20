import type {
  BudgetAnalysis,
  SavingsGoalAnalysis,
  SubscriptionAnalysis,
} from "@/lib/budget-utils";
import type { FinancialReport } from "@/lib/report-utils";

export type FinancialAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  category: "budget" | "goal" | "subscription" | "spending" | "account" | "report";
  href: string;
};

const formatAlertAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export const buildFinancialAlerts = ({
  report,
  budgets,
  goals,
  subscriptions = [],
}: {
  report: FinancialReport;
  budgets: BudgetAnalysis[];
  goals: SavingsGoalAnalysis[];
  subscriptions?: SubscriptionAnalysis[];
}): FinancialAlert[] => {
  const alerts: FinancialAlert[] = [];

  budgets.forEach((budget) => {
    if (budget.status === "over") {
      alerts.push({
        id: `budget-over-${budget.id}`,
        title: `${budget.category} budget is over`,
        detail: `This category is ${formatAlertAmount(
          Math.abs(budget.remaining)
        )} over the monthly limit.`,
        severity: "high",
        category: "budget",
        href: "/budgets",
      });
    } else if (budget.status === "watch") {
      alerts.push({
        id: `budget-watch-${budget.id}`,
        title: `${budget.category} budget is close to limit`,
        detail: `${budget.percentage}% of the monthly limit is already used.`,
        severity: "medium",
        category: "budget",
        href: "/budgets",
      });
    }
  });

  goals.forEach((goal) => {
    if (goal.status === "behind") {
      alerts.push({
        id: `goal-behind-${goal.id}`,
        title: `${goal.name} goal is behind`,
        detail: goal.weeklyNeeded
          ? `Save about ${formatAlertAmount(goal.weeklyNeeded)} weekly to catch up.`
          : "Add a new deadline or contribution to recover this goal.",
        severity: "medium",
        category: "goal",
        href: "/goals",
      });
    } else if (goal.status === "no-date") {
      alerts.push({
        id: `goal-no-date-${goal.id}`,
        title: `${goal.name} has no deadline`,
        detail: "Add a deadline to calculate weekly and monthly savings needs.",
        severity: "low",
        category: "goal",
        href: "/goals",
      });
    }
  });

  subscriptions.forEach((subscription) => {
    if (subscription.status === "overdue") {
      alerts.push({
        id: `subscription-overdue-${subscription.id}`,
        title: `${subscription.name} is overdue`,
        detail: `${formatAlertAmount(subscription.amount)} was due ${Math.abs(
          subscription.daysUntilDue
        )} days ago.`,
        severity: "high",
        category: "subscription",
        href: "/subscriptions",
      });
    } else if (subscription.status === "due-soon") {
      alerts.push({
        id: `subscription-due-${subscription.id}`,
        title: `${subscription.name} is due soon`,
        detail: `${formatAlertAmount(subscription.amount)} is due in ${subscription.daysUntilDue} days.`,
        severity: "medium",
        category: "subscription",
        href: "/subscriptions",
      });
    }
  });

  if (report.currentMonthNet < 0) {
    alerts.push({
      id: "cash-flow-negative",
      title: "Spending is higher than income",
      detail: `Net cash flow is ${formatAlertAmount(report.currentMonthNet)} this month.`,
      severity: "high",
      category: "spending",
      href: "/reports",
    });
  }

  if (report.spendingChangePercent >= 25 && report.currentMonthSpending > 0) {
    alerts.push({
      id: "spending-increase",
      title: "Monthly spending increased",
      detail: `Spending is up ${report.spendingChangePercent}% compared with ${report.previousMonthLabel || "last month"}.`,
      severity: report.spendingChangePercent >= 50 ? "high" : "medium",
      category: "spending",
      href: "/reports",
    });
  }

  if (
    report.largestExpense &&
    report.averageExpense > 0 &&
    report.largestExpense.amount >= report.averageExpense * 2
  ) {
    alerts.push({
      id: `large-transaction-${report.largestExpense.id}`,
      title: "Large transaction detected",
      detail: `${report.largestExpense.name} was ${formatAlertAmount(
        report.largestExpense.amount
      )}, above your average expense.`,
      severity: "medium",
      category: "spending",
      href: "/transaction-history",
    });
  }

  report.accountActivity.forEach((account) => {
    if (account.balance < 0) {
      alerts.push({
        id: `negative-balance-${account.id}`,
        title: `${account.name} has a negative balance`,
        detail: `Current balance is ${formatAlertAmount(account.balance)}.`,
        severity: "high",
        category: "account",
        href: "/my-banks",
      });
    } else if (account.balance > 0 && account.balance < 500) {
      alerts.push({
        id: `low-balance-${account.id}`,
        title: `${account.name} balance is low`,
        detail: `Current balance is ${formatAlertAmount(account.balance)}.`,
        severity: "medium",
        category: "account",
        href: "/my-banks",
      });
    }
  });

  if (!budgets.length) {
    alerts.push({
      id: "missing-budgets",
      title: "No category budgets yet",
      detail: "Add budgets to receive limit warnings before spending gets high.",
      severity: "low",
      category: "budget",
      href: "/budgets",
    });
  }

  if (!goals.length) {
    alerts.push({
      id: "missing-goals",
      title: "No savings goals yet",
      detail: "Add a goal to receive progress and deadline alerts.",
      severity: "low",
      category: "goal",
      href: "/goals",
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: "all-clear",
      title: "Everything looks calm",
      detail: "No urgent budget, goal, spending, or account alerts right now.",
      severity: "low",
      category: "report",
      href: "/insights",
    });
  }

  const severityWeight = { high: 0, medium: 1, low: 2 };
  return alerts.sort(
    (a, b) => severityWeight[a.severity] - severityWeight[b.severity]
  );
};
