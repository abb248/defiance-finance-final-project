"use client";
import { FormattedAmount } from '@/components/FormattedAmount';

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Landmark,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  analyzeBudgetsFromCategorySpending,
  analyzeSavingsGoals,
  getPlannerStateFromStorage,
  type StoredBudget,
  type StoredSavingsGoal,
} from "@/lib/budget-utils";
import {
  buildFinancialHealthInsight,
  type FinancialHealthInsight,
  type HealthScoreFactor,
} from "@/lib/insight-utils";
import type { FinancialReport } from "@/lib/report-utils";
import { cn } from "@/lib/utilsz";

type InsightsDashboardProps = {
  report: FinancialReport;
};

const factorIcons: Record<string, React.ReactNode> = {
  "Cash flow": <CircleDollarSign size={18} />,
  "Budget control": <Gauge size={18} />,
  "Savings goals": <Target size={18} />,
  "Account balance": <Landmark size={18} />,
  Activity: <Activity size={18} />,
};

const statusTone: Record<HealthScoreFactor["status"], string> = {
  good: "bg-success-50 text-success-700",
  watch: "bg-amber-50 text-amber-700",
  risk: "bg-red-50 text-red-700",
};

const getScoreColor = (insight: FinancialHealthInsight) => {
  if (insight.status === "strong") return "text-success-700";
  if (insight.status === "steady") return "text-blue-700";
  return "text-red-700";
};

const InsightsDashboard = ({ report }: InsightsDashboardProps) => {
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [goals, setGoals] = useState<StoredSavingsGoal[]>([]);

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setBudgets(planner.budgets);
    setGoals(planner.savingsGoals);
  }, []);

  const budgetAnalyses = useMemo(
    () => analyzeBudgetsFromCategorySpending(budgets, report.categoryBreakdown),
    [budgets, report.categoryBreakdown]
  );
  const goalAnalyses = useMemo(() => analyzeSavingsGoals(goals), [goals]);
  const insight = useMemo(
    () =>
      buildFinancialHealthInsight({
        report,
        budgets: budgetAnalyses,
        goals: goalAnalyses,
      }),
    [budgetAnalyses, goalAnalyses, report]
  );
  const assistantHref = `/assistant?question=${encodeURIComponent(
    insight.assistantQuestion
  )}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">
              Health score
            </p>
            <span
              className={cn("rounded-full px-3 py-1 text-12 font-semibold", {
                "bg-success-50 text-success-700": insight.status === "strong",
                "bg-blue-50 text-blue-700": insight.status === "steady",
                "bg-red-50 text-red-700": insight.status === "needs-attention",
              })}
            >
              {insight.statusLabel}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center text-center">
            <div className="relative flex size-48 items-center justify-center rounded-full bg-gray-25">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#1570EF ${insight.score * 3.6}deg, #EAECF0 0deg)`,
                }}
              />
              <div className="relative flex size-36 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <p className={cn("text-48 font-bold", getScoreColor(insight))}>
                  {insight.score}
                </p>
                <p className="text-12 font-semibold uppercase text-gray-500">out of 100</p>
              </div>
            </div>
            <h2 className="mt-6 text-20 font-bold text-gray-900">{insight.summary}</h2>
            <p className="mt-2 text-14 text-gray-600">
              Built from cash flow, budgets, goals, balances, and activity.
            </p>
            <Link
              href={assistantHref}
              className="mt-5 flex-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-14 font-semibold text-white hover:bg-blue-700"
            >
              <Sparkles size={16} />
              Explain score
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {insight.factors.map((factor) => (
            <article
              key={factor.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-center size-10 rounded-full bg-blue-50 text-blue-600">
                    {factorIcons[factor.label] || <Gauge size={18} />}
                  </div>
                  <div>
                    <h3 className="text-16 font-bold text-gray-900">{factor.label}</h3>
                    <p className="text-13 text-gray-600">{factor.detail}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-10 font-semibold",
                    statusTone[factor.status]
                  )}
                >
                  {factor.score}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn("h-full rounded-full", {
                    "bg-success-600": factor.status === "good",
                    "bg-amber-500": factor.status === "watch",
                    "bg-red-500": factor.status === "risk",
                  })}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-12 font-semibold uppercase text-gray-500">Action items</p>
              <h2 className="mt-1 text-20 font-bold text-gray-900">
                What to improve first
              </h2>
            </div>
            <AlertTriangle size={20} className="text-amber-600" />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {insight.actionItems.map((item) => (
              <Link
                key={`${item.title}-${item.href}`}
                href={item.href}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-25 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("rounded-full px-2 py-1 text-10 font-semibold", {
                        "bg-red-50 text-red-700": item.priority === "high",
                        "bg-amber-50 text-amber-700": item.priority === "medium",
                        "bg-blue-50 text-blue-700": item.priority === "low",
                      })}
                    >
                      {item.priority}
                    </span>
                    <p className="truncate text-15 font-bold text-gray-900">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-13 text-gray-600">{item.detail}</p>
                </div>
                <ArrowRight size={18} className="mt-1 shrink-0 text-gray-500" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-12 font-semibold uppercase text-gray-500">Accounts</p>
              <h2 className="mt-1 text-20 font-bold text-gray-900">Account insights</h2>
            </div>
            <CheckCircle2 size={20} className="text-success-700" />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {insight.accountInsights.map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-25 p-4">
                <p className="text-12 font-semibold uppercase text-gray-500">
                  {item.label}
                </p>
                <p className="mt-2 truncate text-16 font-bold text-gray-900">
                  {item.account?.name || "No account"}
                </p>
                <p className="mt-1 text-13 text-gray-600">{item.detail}</p>
                {item.account ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-12 text-gray-600">
                    <div className="rounded-md bg-white p-2">
                      Balance
                      <p className="font-bold text-gray-900">
                        <FormattedAmount amount={item.account.balance} />
                      </p>
                    </div>
                    <div className="rounded-md bg-white p-2">
                      Spending
                      <p className="font-bold text-gray-900">
                        <FormattedAmount amount={item.account.spending} />
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InsightsDashboard;
