"use client";
import { FormattedAmount } from '@/components/FormattedAmount';

import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  analyzeBudgetsFromTransactions,
  createPlannerId,
  getBudgetCategoryOptions,
  getCurrentMonthCategorySpending,
  getPlannerStateFromStorage,
  normalizeBudgetCategory,
  savePlannerStateToStorage,
  type BudgetAnalysis,
  type StoredBudget,
  type StoredSavingsGoal,
  type StoredSubscription,
} from "@/lib/budget-utils";
import { cn, formatAmount } from "@/lib/utilsz";

type BudgetManagementProps = {
  accounts: Account[];
  transactions: Transaction[];
  totalCurrentBalance: number;
};

const statusCopy: Record<BudgetAnalysis["status"], { label: string; tone: string }> = {
  good: {
    label: "On track",
    tone: "bg-success-50 text-success-700",
  },
  watch: {
    label: "Watch closely",
    tone: "bg-amber-50 text-amber-700",
  },
  over: {
    label: "Over budget",
    tone: "bg-red-50 text-red-700",
  },
};

const BudgetManagement = ({
  accounts,
  transactions,
  totalCurrentBalance,
}: BudgetManagementProps) => {
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<StoredSavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<StoredSubscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categoryChoice, setCategoryChoice] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const categorySpending = useMemo(
    () => getCurrentMonthCategorySpending(transactions),
    [transactions]
  );
  const categoryOptions = useMemo(
    () => getBudgetCategoryOptions(transactions, budgets.map((budget) => budget.category)),
    [budgets, transactions]
  );
  const budgetAnalyses = useMemo(
    () => analyzeBudgetsFromTransactions(budgets, transactions),
    [budgets, transactions]
  );

  const selectedCategory =
    categoryChoice === "custom"
      ? customCategory.trim()
      : categoryChoice || categoryOptions[0] || "Food and Drink";
  const selectedCategorySpending =
    categorySpending.find(
      (category) =>
        category.name.toLowerCase() === normalizeBudgetCategory(selectedCategory).toLowerCase()
    )?.amount || 0;
  const suggestedLimit = selectedCategorySpending
    ? Math.ceil((selectedCategorySpending * 1.12) / 50) * 50
    : 0;

  const totalBudget = budgetAnalyses.reduce(
    (sum, budget) => sum + budget.monthlyLimit,
    0
  );
  const totalSpent = budgetAnalyses.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const usedPercentage = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const riskCount = budgetAnalyses.filter((budget) => budget.status !== "good").length;
  const uncoveredCategories = categorySpending.filter(
    (category) =>
      !budgets.some(
        (budget) =>
          budget.category.toLowerCase() === category.name.toLowerCase()
      )
  );

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setBudgets(planner.budgets);
    setSavingsGoals(planner.savingsGoals);
    setSubscriptions(planner.subscriptions);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    savePlannerStateToStorage({ budgets, savingsGoals, subscriptions });
  }, [budgets, isLoaded, savingsGoals, subscriptions]);

  useEffect(() => {
    if (!categoryChoice && categoryOptions[0]) {
      setCategoryChoice(categoryOptions[0]);
    }
  }, [categoryChoice, categoryOptions]);

  const resetForm = () => {
    setEditingBudgetId(null);
    setMonthlyLimit("");
    setCustomCategory("");
    setCategoryChoice(categoryOptions[0] || "Food and Drink");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const category = normalizeBudgetCategory(selectedCategory);
    const limit = Number(monthlyLimit);

    if (!category || !limit || limit <= 0) {
      setNotice("Choose a category and enter a monthly limit greater than 0.");
      return;
    }

    setBudgets((current) => {
      const withoutSameCategory = current.filter(
        (budget) =>
          budget.id === editingBudgetId ||
          budget.category.toLowerCase() !== category.toLowerCase()
      );

      if (editingBudgetId) {
        return withoutSameCategory.map((budget) =>
          budget.id === editingBudgetId
            ? { ...budget, category, monthlyLimit: limit }
            : budget
        );
      }

      return [
        ...withoutSameCategory,
        {
          id: createPlannerId(),
          category,
          monthlyLimit: limit,
        },
      ];
    });

    setNotice(
      editingBudgetId
        ? `${category} budget was updated.`
        : `${category} budget was added.`
    );
    resetForm();
  };

  const startEditing = (budget: StoredBudget) => {
    setEditingBudgetId(budget.id);
    setCategoryChoice(budget.category);
    setCustomCategory("");
    setMonthlyLimit(String(budget.monthlyLimit));
    setNotice(`Editing ${budget.category} budget.`);
  };

  const removeBudget = (budget: StoredBudget) => {
    setBudgets((current) => current.filter((item) => item.id !== budget.id));
    setNotice(`${budget.category} budget was removed.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Monthly budget</p>
            <WalletCards size={18} className="text-blue-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900"><FormattedAmount amount={totalBudget} /></p>
          <p className="mt-1 text-13 text-gray-600">{budgetAnalyses.length} active categories</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Used this month</p>
            <PiggyBank size={18} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900"><FormattedAmount amount={totalSpent} /></p>
          <p className="mt-1 text-13 text-gray-600">{usedPercentage}% of planned budget</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Remaining</p>
            <Target size={18} className="text-indigo-700" />
          </div>
          <p
            className={cn("mt-3 text-24 font-bold", {
              "text-red-600": totalRemaining < 0,
              "text-gray-900": totalRemaining >= 0,
            })}
          >
            <FormattedAmount amount={totalRemaining} />
          </p>
          <p className="mt-1 text-13 text-gray-600">
            Across {accounts.length} connected accounts
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Needs attention</p>
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{riskCount}</p>
          <p className="mt-1 text-13 text-gray-600">
            Total balance <FormattedAmount amount={totalCurrentBalance} />
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">
                  Budget setup
                </p>
                <h2 className="mt-1 text-20 font-bold text-gray-900">
                  {editingBudgetId ? "Update category limit" : "Add a category limit"}
                </h2>
              </div>
              {editingBudgetId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-12 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {notice ? (
              <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-13 font-medium text-blue-700">
                {notice}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Category</span>
                <select
                  value={categoryChoice}
                  onChange={(event) => setCategoryChoice(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="custom">Custom category</option>
                </select>
              </label>

              {categoryChoice === "custom" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-13 font-semibold text-gray-700">Custom name</span>
                  <input
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value)}
                    className="input-class h-11 px-3 text-14"
                    placeholder="Example: Entertainment"
                  />
                </label>
              ) : null}

              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Monthly limit</span>
                <input
                  value={monthlyLimit}
                  onChange={(event) => setMonthlyLimit(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                  min="1"
                  placeholder="Example: 450"
                  type="number"
                />
              </label>

              {suggestedLimit ? (
                <button
                  type="button"
                  onClick={() => setMonthlyLimit(String(suggestedLimit))}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-left text-13 font-semibold text-blue-700 hover:border-blue-200"
                >
                  Use suggested limit: <FormattedAmount amount={suggestedLimit} />
                </button>
              ) : null}

              <button
                type="submit"
                className="flex-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-14 font-semibold text-white shadow-form transition-colors hover:bg-blue-700"
              >
                <Plus size={16} />
                {editingBudgetId ? "Update budget" : "Add budget"}
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-12 font-semibold uppercase text-gray-500">
              Spending categories
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {categorySpending.length ? (
                categorySpending.slice(0, 6).map((category) => (
                  <div key={category.name}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="truncate text-14 font-semibold text-gray-700">
                        {category.name}
                      </p>
                      <p className="text-12 text-gray-600">
                        <FormattedAmount amount={category.amount} />
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 bg-gray-25 p-4 text-14 text-gray-600">
                  No spending data for this month yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {budgetAnalyses.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {budgetAnalyses.map((budget) => {
                const status = statusCopy[budget.status];

                return (
                  <article
                    key={budget.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-18 font-bold text-gray-900">
                            {budget.category}
                          </h3>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-1 text-10 font-semibold",
                              status.tone
                            )}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-1 text-13 text-gray-600">
                          {formatAmount(Math.max(0, budget.remaining))} left from{" "}
                          <FormattedAmount amount={budget.monthlyLimit} />
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(budget)}
                          aria-label={`Edit ${budget.category} budget`}
                          className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBudget(budget)}
                          aria-label={`Remove ${budget.category} budget`}
                          className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-12 font-semibold text-gray-600">
                        <span><FormattedAmount amount={budget.spent} /> spent</span>
                        <span>{budget.percentage}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn("h-full rounded-full", {
                            "bg-blue-600": budget.status === "good",
                            "bg-amber-500": budget.status === "watch",
                            "bg-red-500": budget.status === "over",
                          })}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-gray-25 p-3">
                      <div className="flex items-start gap-2">
                        {budget.status === "good" ? (
                          <CheckCircle2 size={16} className="mt-0.5 text-success-700" />
                        ) : (
                          <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
                        )}
                        <p className="text-13 text-gray-600">
                          {budget.status === "over"
                            ? `This category is over by ${formatAmount(
                                Math.abs(budget.remaining)
                              )}.`
                            : budget.status === "watch"
                            ? "This category is close to the limit."
                            : "This category is under control for now."}{" "}
                          {budget.suggestedLimit > budget.monthlyLimit
                            ? `A safer limit could be $<FormattedAmount amount={
                                budget.suggestedLimit
                              } />.`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <WalletCards size={42} className="text-gray-400" strokeWidth={1.5} />
              <h2 className="mt-4 text-20 font-bold text-gray-900">No budgets yet</h2>
              <p className="mt-2 max-w-md text-14 text-gray-600">
                Add monthly limits for the categories you want to watch. The progress
                updates from this month's transactions.
              </p>
            </div>
          )}

          {uncoveredCategories.length ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Suggested next budgets
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {uncoveredCategories.slice(0, 4).map((category) => {
                  const nextLimit = Math.ceil((category.amount * 1.12) / 50) * 50;

                  return (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => {
                        setCategoryChoice(category.name);
                        setMonthlyLimit(String(nextLimit));
                        setEditingBudgetId(null);
                        setNotice(`${category.name} is ready with a suggested limit.`);
                      }}
                      className="rounded-lg border border-gray-200 bg-gray-25 p-4 text-left hover:border-blue-200 hover:bg-blue-50"
                    >
                      <p className="text-14 font-semibold text-gray-800">{category.name}</p>
                      <p className="mt-1 text-12 text-gray-600">
                        Spent <FormattedAmount amount={category.amount} /> this month
                      </p>
                      <p className="mt-2 text-12 font-semibold text-blue-700">
                        Suggest <FormattedAmount amount={nextLimit} />
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default BudgetManagement;
