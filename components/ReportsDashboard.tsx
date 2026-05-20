"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  CreditCard,
  Landmark,
  ReceiptText,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import ReportsCharts from "@/components/ReportsCharts";
import {
  analyzeSavingsGoals,
  analyzeSubscriptions,
  getPlannerStateFromStorage,
  type StoredSavingsGoal,
  type StoredSubscription,
} from "@/lib/budget-utils";
import type { FinancialReport } from "@/lib/report-utils";
import { cn, formatAmount } from "@/lib/utilsz";

type ReportsDashboardProps = {
  report: FinancialReport;
};

const MetricCard = ({
  label,
  value,
  detail,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "blue" | "green" | "red" | "gray";
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-12 font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-3 text-24 font-bold text-gray-900">{value}</p>
      </div>
      <div
        className={cn("flex-center size-11 shrink-0 rounded-full", {
          "bg-blue-50 text-blue-600": tone === "blue",
          "bg-success-50 text-success-700": tone === "green",
          "bg-red-50 text-red-600": tone === "red",
          "bg-gray-100 text-gray-600": tone === "gray",
        })}
      >
        {icon}
      </div>
    </div>
    <p className="mt-3 text-13 text-gray-600">{detail}</p>
  </div>
);

const ReportsDashboard = ({ report }: ReportsDashboardProps) => {
  const [copyStatus, setCopyStatus] = useState("Copy report");
  const [savingsGoals, setSavingsGoals] = useState<StoredSavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<StoredSubscription[]>([]);
  const spendingChangeIsUp = report.spendingChangePercent > 0;
  const savingsGoalAnalyses = useMemo(
    () => analyzeSavingsGoals(savingsGoals),
    [savingsGoals]
  );
  const topGoal =
    savingsGoalAnalyses.find((goal) => goal.status === "behind") ||
    savingsGoalAnalyses[0];
  const subscriptionAnalyses = useMemo(
    () => analyzeSubscriptions(subscriptions),
    [subscriptions]
  );
  const recurringMonthlyTotal = subscriptionAnalyses.reduce(
    (sum, subscription) => sum + subscription.monthlyAmount,
    0
  );
  const upcomingSubscription =
    subscriptionAnalyses.find((subscription) => subscription.status !== "paid") ||
    subscriptionAnalyses[0];
  const assistantHref = `/assistant?question=${encodeURIComponent(
    report.assistantQuestion
  )}`;

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setSavingsGoals(planner.savingsGoals);
    setSubscriptions(planner.subscriptions);
  }, []);

  const copyReport = async () => {
    const text = [
      `Financial report for ${report.monthLabel}`,
      ...report.reportSummary,
      report.mostActiveAccount
        ? `Most active account: ${report.mostActiveAccount.name}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy report"), 1800);
    } catch {
      setCopyStatus("Could not copy");
      window.setTimeout(() => setCopyStatus("Copy report"), 1800);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Income"
          value={formatAmount(report.currentMonthIncome)}
          detail={`Money in during ${report.monthLabel}`}
          icon={<ArrowUpRight size={20} />}
          tone="green"
        />
        <MetricCard
          label="Spending"
          value={formatAmount(report.currentMonthSpending)}
          detail={`${report.spendingChangePercent}% vs ${report.previousMonthLabel}`}
          icon={spendingChangeIsUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          tone={spendingChangeIsUp ? "red" : "blue"}
        />
        <MetricCard
          label="Net cash flow"
          value={formatAmount(report.currentMonthNet)}
          detail={`${report.transactionCount} transactions this month`}
          icon={<ArrowDownRight size={20} />}
          tone={report.currentMonthNet >= 0 ? "blue" : "red"}
        />
        <MetricCard
          label="Average expense"
          value={formatAmount(report.averageExpense)}
          detail="Average debit transaction"
          icon={<ReceiptText size={20} />}
          tone="gray"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-12 font-semibold uppercase text-gray-500">Report summary</p>
              <h2 className="mt-1 text-20 font-bold text-gray-900">
                {report.monthLabel} financial snapshot
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyReport}
                className="flex-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-13 font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Copy size={15} />
                {copyStatus}
              </button>
              <Link
                href={assistantHref}
                className="flex-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-13 font-semibold text-white hover:bg-blue-700"
              >
                <Sparkles size={15} />
                Ask assistant
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-12 font-semibold uppercase text-blue-700">
                Top category
              </p>
              <p className="mt-2 truncate text-18 font-bold text-blue-900">
                {report.topCategory?.name || "Not enough data"}
              </p>
              <p className="mt-1 text-13 text-blue-700">
                {report.topCategory
                  ? `${report.topCategory.percentage}% of spending`
                  : "No spending yet"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-25 p-4">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Largest expense
              </p>
              <p className="mt-2 truncate text-18 font-bold text-gray-900">
                {report.largestExpense?.name || "Not enough data"}
              </p>
              <p className="mt-1 text-13 text-gray-600">
                {report.largestExpense
                  ? formatAmount(report.largestExpense.amount)
                  : "No debit transaction"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-25 p-4">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Active account
              </p>
              <p className="mt-2 truncate text-18 font-bold text-gray-900">
                {report.mostActiveAccount?.name || "No account activity"}
              </p>
              <p className="mt-1 text-13 text-gray-600">
                {report.mostActiveAccount
                  ? `${report.mostActiveAccount.transactionCount} transactions`
                  : "No activity this month"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-25 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Target size={15} />
                <p className="text-12 font-semibold uppercase">Savings goal</p>
              </div>
              <p className="mt-2 truncate text-18 font-bold text-gray-900">
                {topGoal?.name || "No goal yet"}
              </p>
              <p className="mt-1 text-13 text-gray-600">
                {topGoal
                  ? `${topGoal.percentage}% complete, ${formatAmount(topGoal.remaining)} left`
                  : "Add one from Goals"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-25 p-4">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Fixed costs
              </p>
              <p className="mt-2 truncate text-18 font-bold text-gray-900">
                {formatAmount(recurringMonthlyTotal)}
              </p>
              <p className="mt-1 text-13 text-gray-600">
                {upcomingSubscription
                  ? `${upcomingSubscription.name} is next`
                  : "No subscriptions yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-12 font-semibold uppercase text-gray-500">Accounts</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-lg bg-gray-25 p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Landmark size={17} />
                <p className="text-13 font-semibold">Current balance</p>
              </div>
              <p className="mt-2 text-20 font-bold text-gray-900">
                {formatAmount(report.totalCurrentBalance)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-25 p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <CreditCard size={17} />
                <p className="text-13 font-semibold">Tracked accounts</p>
              </div>
              <p className="mt-2 text-20 font-bold text-gray-900">
                {report.accountActivity.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ReportsCharts report={report} />
    </div>
  );
};

export default ReportsDashboard;
