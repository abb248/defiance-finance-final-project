import type { BudgetAnalysis, SavingsGoalAnalysis } from "@/lib/budget-utils";
import type { FinancialReport, ReportAccountActivity } from "@/lib/report-utils";

export type HealthScoreFactor = {
  label: string;
  score: number;
  detail: string;
  status: "good" | "watch" | "risk";
};

export type HealthActionItem = {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  href: string;
};

export type AccountInsight = {
  label: string;
  account: ReportAccountActivity | null;
  detail: string;
};

export type FinancialHealthInsight = {
  score: number;
  status: "strong" | "steady" | "needs-attention";
  statusLabel: string;
  summary: string;
  factors: HealthScoreFactor[];
  actionItems: HealthActionItem[];
  accountInsights: AccountInsight[];
  assistantQuestion: string;
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Math.round(value)));

const getFactorStatus = (score: number): HealthScoreFactor["status"] => {
  if (score >= 75) return "good";
  if (score >= 50) return "watch";
  return "risk";
};

const getAverageBudgetScore = (budgets: BudgetAnalysis[]) => {
  if (!budgets.length) return 65;

  const scores = budgets.map((budget) => {
    if (budget.status === "over") return 30;
    if (budget.status === "watch") return 60;
    return 90;
  });

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const getGoalScore = (goals: SavingsGoalAnalysis[]) => {
  if (!goals.length) return 60;

  const scores = goals.map((goal) => {
    if (goal.status === "completed") return 100;
    if (goal.status === "on-track") return 85;
    if (goal.status === "no-date") return 65;
    return 35;
  });

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

export const buildFinancialHealthInsight = ({
  report,
  budgets,
  goals,
}: {
  report: FinancialReport;
  budgets: BudgetAnalysis[];
  goals: SavingsGoalAnalysis[];
}): FinancialHealthInsight => {
  const incomeScore = report.currentMonthIncome
    ? clamp((report.currentMonthNet / Math.max(report.currentMonthIncome, 1)) * 100 + 55)
    : report.currentMonthSpending
    ? 35
    : 60;
  const budgetScore = getAverageBudgetScore(budgets);
  const goalScore = getGoalScore(goals);
  const balanceScore = report.totalCurrentBalance > 0 ? 80 : 45;
  const activityScore =
    report.transactionCount >= 10 ? 85 : report.transactionCount >= 4 ? 70 : 55;

  const factors: HealthScoreFactor[] = [
    {
      label: "Cash flow",
      score: clamp(incomeScore),
      detail:
        report.currentMonthNet >= 0
          ? "Income is covering this month's spending."
          : "Spending is higher than income this month.",
      status: getFactorStatus(incomeScore),
    },
    {
      label: "Budget control",
      score: clamp(budgetScore),
      detail: budgets.length
        ? `${budgets.filter((budget) => budget.status !== "good").length} budget categories need attention.`
        : "No category budget has been added yet.",
      status: getFactorStatus(budgetScore),
    },
    {
      label: "Savings goals",
      score: clamp(goalScore),
      detail: goals.length
        ? `${goals.filter((goal) => goal.status === "behind").length} goals are behind.`
        : "No savings goal has been added yet.",
      status: getFactorStatus(goalScore),
    },
    {
      label: "Account balance",
      score: clamp(balanceScore),
      detail:
        report.totalCurrentBalance > 0
          ? "Total account balance is positive."
          : "Total account balance needs attention.",
      status: getFactorStatus(balanceScore),
    },
    {
      label: "Activity",
      score: clamp(activityScore),
      detail: `${report.transactionCount} transactions are tracked this month.`,
      status: getFactorStatus(activityScore),
    },
  ];

  const score = clamp(
    factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length
  );
  const status =
    score >= 78 ? "strong" : score >= 58 ? "steady" : "needs-attention";
  const statusLabel =
    status === "strong"
      ? "Strong"
      : status === "steady"
      ? "Steady"
      : "Needs attention";

  const actionItems: HealthActionItem[] = [];
  const riskyBudget = budgets.find((budget) => budget.status !== "good");
  const riskyGoal = goals.find((goal) => goal.status === "behind");

  if (report.currentMonthNet < 0) {
    actionItems.push({
      title: "Bring cash flow back above zero",
      detail: "This month spending is higher than income.",
      priority: "high",
      href: "/reports",
    });
  }

  if (riskyBudget) {
    actionItems.push({
      title: `${riskyBudget.category} budget needs attention`,
      detail: `${riskyBudget.percentage}% of the monthly limit is already used.`,
      priority: riskyBudget.status === "over" ? "high" : "medium",
      href: "/budgets",
    });
  }

  if (riskyGoal) {
    actionItems.push({
      title: `${riskyGoal.name} goal is behind`,
      detail: `Saving about ${Math.round(riskyGoal.weeklyNeeded)} per week can help catch up.`,
      priority: "medium",
      href: "/goals",
    });
  }

  if (!budgets.length) {
    actionItems.push({
      title: "Add category budgets",
      detail: "Budgets make the health score more specific and useful.",
      priority: "low",
      href: "/budgets",
    });
  }

  if (!goals.length) {
    actionItems.push({
      title: "Add a savings goal",
      detail: "A goal helps track whether current saving pace is enough.",
      priority: "low",
      href: "/goals",
    });
  }

  if (!actionItems.length) {
    actionItems.push({
      title: "Keep the current pace",
      detail: "Cash flow, budgets, and goals are looking healthy.",
      priority: "low",
      href: "/reports",
    });
  }

  const highestBalance =
    [...report.accountActivity].sort((a, b) => b.balance - a.balance)[0] || null;
  const highestSpending =
    [...report.accountActivity].sort((a, b) => b.spending - a.spending)[0] || null;
  const mostActive = report.mostActiveAccount || null;

  return {
    score,
    status,
    statusLabel,
    summary:
      status === "strong"
        ? "Your financial health looks strong this month."
        : status === "steady"
        ? "Your financial health is steady, with a few areas to watch."
        : "Your financial health needs attention in a few places.",
    factors,
    actionItems: actionItems.slice(0, 5),
    accountInsights: [
      {
        label: "Highest balance",
        account: highestBalance,
        detail: highestBalance
          ? `${highestBalance.name} has the strongest balance.`
          : "No account balance found.",
      },
      {
        label: "Highest spending",
        account: highestSpending,
        detail: highestSpending
          ? `${highestSpending.name} has the most spending this month.`
          : "No account spending found.",
      },
      {
        label: "Most active",
        account: mostActive,
        detail: mostActive
          ? `${mostActive.name} has the most transaction activity.`
          : "No account activity found.",
      },
    ],
    assistantQuestion:
      "Can you explain my financial health score and tell me what to improve first?",
  };
};
