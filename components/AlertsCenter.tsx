"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Flag,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  analyzeBudgetsFromCategorySpending,
  analyzeSavingsGoals,
  analyzeSubscriptions,
  getPlannerStateFromStorage,
  type StoredBudget,
  type StoredSavingsGoal,
  type StoredSubscription,
} from "@/lib/budget-utils";
import { buildFinancialAlerts, type FinancialAlert } from "@/lib/alert-utils";
import type { FinancialReport } from "@/lib/report-utils";
import { cn } from "@/lib/utilsz";

type AlertsCenterProps = {
  report: FinancialReport;
};

const ALERTS_STORAGE_KEY = "defiance-resolved-alerts";

const severityTone: Record<FinancialAlert["severity"], string> = {
  high: "bg-red-50 text-red-700 border-red-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low: "bg-blue-50 text-blue-700 border-blue-100",
};

const categoryLabels: Record<FinancialAlert["category"], string> = {
  account: "Account",
  budget: "Budget",
  goal: "Goal",
  report: "Report",
  spending: "Spending",
  subscription: "Subscription",
};

const getResolvedAlerts = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(ALERTS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

const AlertsCenter = ({ report }: AlertsCenterProps) => {
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [goals, setGoals] = useState<StoredSavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<StoredSubscription[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<"open" | "resolved" | "all">("open");

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setBudgets(planner.budgets);
    setGoals(planner.savingsGoals);
    setSubscriptions(planner.subscriptions);
    setResolvedAlerts(getResolvedAlerts());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(resolvedAlerts));
  }, [resolvedAlerts]);

  const budgetAnalyses = useMemo(
    () => analyzeBudgetsFromCategorySpending(budgets, report.categoryBreakdown),
    [budgets, report.categoryBreakdown]
  );
  const goalAnalyses = useMemo(() => analyzeSavingsGoals(goals), [goals]);
  const subscriptionAnalyses = useMemo(
    () => analyzeSubscriptions(subscriptions),
    [subscriptions]
  );
  const alerts = useMemo(
    () =>
      buildFinancialAlerts({
        report,
        budgets: budgetAnalyses,
        goals: goalAnalyses,
        subscriptions: subscriptionAnalyses,
      }),
    [budgetAnalyses, goalAnalyses, report, subscriptionAnalyses]
  );
  const openAlerts = alerts.filter((alert) => !resolvedAlerts.includes(alert.id));
  const resolvedAlertItems = alerts.filter((alert) => resolvedAlerts.includes(alert.id));
  const highAlerts = openAlerts.filter((alert) => alert.severity === "high");
  const filteredAlerts =
    activeFilter === "resolved"
      ? resolvedAlertItems
      : activeFilter === "all"
      ? alerts
      : openAlerts;
  const assistantHref = `/assistant?question=${encodeURIComponent(
    "What alerts should I care about first?"
  )}`;

  const toggleResolved = (alertId: string) => {
    setResolvedAlerts((current) =>
      current.includes(alertId)
        ? current.filter((id) => id !== alertId)
        : [...current, alertId]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Open alerts</p>
            <Bell size={18} className="text-blue-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{openAlerts.length}</p>
          <p className="mt-1 text-13 text-gray-600">Needs review right now</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">High priority</p>
            <CircleAlert size={18} className="text-red-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{highAlerts.length}</p>
          <p className="mt-1 text-13 text-gray-600">Budget, balance, or cash flow risks</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Resolved</p>
            <CheckCircle2 size={18} className="text-success-700" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{resolvedAlertItems.length}</p>
          <p className="mt-1 text-13 text-gray-600">Marked as handled</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Assistant</p>
            <Sparkles size={18} className="text-indigo-700" />
          </div>
          <Link
            href={assistantHref}
            className="mt-3 flex-center rounded-lg bg-blue-600 px-3 py-2 text-13 font-semibold text-white hover:bg-blue-700"
          >
            Ask about alerts
          </Link>
          <p className="mt-2 text-13 text-gray-600">Get a short priority explanation</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-12 font-semibold uppercase text-gray-500">Alerts Center</p>
            <h2 className="mt-1 text-20 font-bold text-gray-900">
              Budget, goal, spending, and account warnings
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["open", "resolved", "all"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-13 font-semibold capitalize transition-colors",
                  activeFilter === filter
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {filteredAlerts.map((alert) => {
            const isResolved = resolvedAlerts.includes(alert.id);

            return (
              <article
                key={alert.id}
                className={cn(
                  "rounded-xl border p-5 transition-colors",
                  isResolved
                    ? "border-gray-200 bg-gray-25 opacity-75"
                    : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-1 text-10 font-semibold",
                          severityTone[alert.severity]
                        )}
                      >
                        {alert.severity}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-10 font-semibold text-gray-600">
                        {categoryLabels[alert.category]}
                      </span>
                      {isResolved ? (
                        <span className="rounded-full bg-success-50 px-2 py-1 text-10 font-semibold text-success-700">
                          resolved
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-18 font-bold text-gray-900">{alert.title}</h3>
                    <p className="mt-2 text-14 text-gray-600">{alert.detail}</p>
                  </div>
                  <div
                    className={cn("flex-center size-11 shrink-0 rounded-full", {
                      "bg-red-50 text-red-600": alert.severity === "high",
                      "bg-amber-50 text-amber-600": alert.severity === "medium",
                      "bg-blue-50 text-blue-600": alert.severity === "low",
                    })}
                  >
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={alert.href}
                    className="flex-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-13 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Flag size={14} />
                    Review
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleResolved(alert.id)}
                    className={cn(
                      "flex-center gap-2 rounded-lg px-3 py-2 text-13 font-semibold",
                      isResolved
                        ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-success-600 text-white hover:bg-success-700"
                    )}
                  >
                    <CheckCircle2 size={14} />
                    {isResolved ? "Reopen" : "Mark resolved"}
                  </button>
                </div>
              </article>
            );
          })}

          {!filteredAlerts.length ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-25 p-8 text-center">
              <CheckCircle2 className="mx-auto size-10 text-success-700" />
              <h3 className="mt-3 text-18 font-bold text-gray-900">No alerts here</h3>
              <p className="mt-2 text-14 text-gray-600">
                Switch filters or wait for new budget, goal, account, or spending changes.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default AlertsCenter;
