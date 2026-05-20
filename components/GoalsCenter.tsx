"use client";
import { FormattedAmount } from '@/components/FormattedAmount';

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Edit3,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  analyzeSavingsGoals,
  createPlannerId,
  getPlannerStateFromStorage,
  savePlannerStateToStorage,
  type SavingsGoalAnalysis,
  type StoredBudget,
  type StoredSavingsGoal,
  type StoredSubscription,
} from "@/lib/budget-utils";
import { cn, formatAmount } from "@/lib/utilsz";

type GoalsCenterProps = {
  accounts: Account[];
  totalCurrentBalance: number;
};

const statusContent: Record<SavingsGoalAnalysis["status"], { label: string; tone: string }> = {
  completed: {
    label: "Completed",
    tone: "bg-success-50 text-success-700",
  },
  "on-track": {
    label: "On track",
    tone: "bg-blue-50 text-blue-700",
  },
  behind: {
    label: "Behind",
    tone: "bg-red-50 text-red-700",
  },
  "no-date": {
    label: "No deadline",
    tone: "bg-gray-100 text-gray-600",
  },
};

const GoalsCenter = ({ accounts, totalCurrentBalance }: GoalsCenterProps) => {
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [goals, setGoals] = useState<StoredSavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<StoredSubscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const goalAnalyses = useMemo(() => analyzeSavingsGoals(goals), [goals]);
  const totalTarget = goalAnalyses.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goalAnalyses.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalRemaining = goalAnalyses.reduce((sum, goal) => sum + goal.remaining, 0);
  const overallPercentage = totalTarget
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
    : 0;
  const urgentGoal =
    goalAnalyses.find((goal) => goal.status === "behind") ||
    goalAnalyses.find((goal) => goal.status === "on-track") ||
    goalAnalyses[0];

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setBudgets(planner.budgets);
    setGoals(planner.savingsGoals);
    setSubscriptions(planner.subscriptions);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    savePlannerStateToStorage({ budgets, savingsGoals: goals, subscriptions });
  }, [budgets, goals, isLoaded, subscriptions]);

  const resetForm = () => {
    setEditingGoalId(null);
    setGoalName("");
    setTargetAmount("");
    setCurrentAmount("");
    setTargetDate("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = goalName.trim();
    const target = Number(targetAmount);
    const current = Number(currentAmount) || 0;

    if (!cleanName || !target || target <= 0) {
      setNotice("Enter a goal name and a target amount greater than 0.");
      return;
    }

    setGoals((currentGoals) => {
      if (editingGoalId) {
        return currentGoals.map((goal) =>
          goal.id === editingGoalId
            ? {
                ...goal,
                name: cleanName,
                targetAmount: target,
                currentAmount: Math.min(current, target),
                targetDate: targetDate || undefined,
              }
            : goal
        );
      }

      return [
        ...currentGoals,
        {
          id: createPlannerId(),
          name: cleanName,
          targetAmount: target,
          currentAmount: Math.min(current, target),
          targetDate: targetDate || undefined,
        },
      ];
    });

    setNotice(editingGoalId ? `${cleanName} goal was updated.` : `${cleanName} goal was added.`);
    resetForm();
  };

  const startEditing = (goal: StoredSavingsGoal) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setTargetDate(goal.targetDate || "");
    setNotice(`Editing ${goal.name} goal.`);
  };

  const removeGoal = (goal: StoredSavingsGoal) => {
    setGoals((currentGoals) => currentGoals.filter((item) => item.id !== goal.id));
    setNotice(`${goal.name} goal was removed.`);
  };

  const addContribution = (goal: SavingsGoalAnalysis) => {
    const contribution = Number(contributions[goal.id]);
    if (!contribution || contribution <= 0) {
      setNotice("Enter a contribution greater than 0.");
      return;
    }

    setGoals((currentGoals) =>
      currentGoals.map((item) =>
        item.id === goal.id
          ? {
              ...item,
              currentAmount: Math.min(item.targetAmount, item.currentAmount + contribution),
            }
          : item
      )
    );
    setContributions((current) => ({ ...current, [goal.id]: "" }));
    setNotice(`$<FormattedAmount amount={contribution} /> was added to ${goal.name}.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Goal target</p>
            <Target size={18} className="text-blue-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900"><FormattedAmount amount={totalTarget} /></p>
          <p className="mt-1 text-13 text-gray-600">{goalAnalyses.length} active goals</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Saved</p>
            <PiggyBank size={18} className="text-success-700" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900"><FormattedAmount amount={totalSaved} /></p>
          <p className="mt-1 text-13 text-gray-600">{overallPercentage}% of all goals</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Remaining</p>
            <Wallet size={18} className="text-indigo-700" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900"><FormattedAmount amount={totalRemaining} /></p>
          <p className="mt-1 text-13 text-gray-600">
            {accounts.length} accounts, balance <FormattedAmount amount={totalCurrentBalance} />
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Priority</p>
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <p className="mt-3 truncate text-24 font-bold text-gray-900">
            {urgentGoal?.name || "No goal"}
          </p>
          <p className="mt-1 text-13 text-gray-600">
            {urgentGoal ? statusContent[urgentGoal.status].label : "Add a goal to start"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-12 font-semibold uppercase text-gray-500">Goal setup</p>
              <h2 className="mt-1 text-20 font-bold text-gray-900">
                {editingGoalId ? "Update savings goal" : "Add savings goal"}
              </h2>
            </div>
            {editingGoalId ? (
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
              <span className="text-13 font-semibold text-gray-700">Goal name</span>
              <input
                value={goalName}
                onChange={(event) => setGoalName(event.target.value)}
                className="input-class h-11 px-3 text-14"
                placeholder="Example: Emergency fund"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Target</span>
                <input
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                  min="1"
                  placeholder="5000"
                  type="number"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Saved</span>
                <input
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                  min="0"
                  placeholder="750"
                  type="number"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-13 font-semibold text-gray-700">Deadline</span>
              <input
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="input-class h-11 px-3 text-14"
                type="date"
              />
            </label>

            <button
              type="submit"
              className="flex-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-14 font-semibold text-white shadow-form transition-colors hover:bg-blue-700"
            >
              <Plus size={16} />
              {editingGoalId ? "Update goal" : "Add goal"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          {goalAnalyses.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {goalAnalyses.map((goal) => {
                const status = statusContent[goal.status];

                return (
                  <article
                    key={goal.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-18 font-bold text-gray-900">
                            {goal.name}
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
                          <FormattedAmount amount={goal.remaining} /> left from{" "}
                          <FormattedAmount amount={goal.targetAmount} />
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(goal)}
                          aria-label={`Edit ${goal.name} goal`}
                          className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGoal(goal)}
                          aria-label={`Remove ${goal.name} goal`}
                          className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-12 font-semibold text-gray-600">
                        <span><FormattedAmount amount={goal.currentAmount} /> saved</span>
                        <span>{goal.percentage}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn("h-full rounded-full", {
                            "bg-success-600": goal.status === "completed",
                            "bg-blue-600": goal.status === "on-track",
                            "bg-red-500": goal.status === "behind",
                            "bg-gray-500": goal.status === "no-date",
                          })}
                          style={{ width: `${goal.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-gray-25 p-3">
                        <p className="text-12 text-gray-600">Weekly need</p>
                        <p className="mt-1 text-14 font-bold text-gray-900">
                          {goal.weeklyNeeded ? formatAmount(goal.weeklyNeeded) : "No date"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-25 p-3">
                        <p className="text-12 text-gray-600">Monthly need</p>
                        <p className="mt-1 text-14 font-bold text-gray-900">
                          {goal.monthlyNeeded ? formatAmount(goal.monthlyNeeded) : "No date"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-25 p-3">
                        <p className="text-12 text-gray-600">Days left</p>
                        <p className="mt-1 text-14 font-bold text-gray-900">
                          {goal.daysLeft === null ? "No date" : Math.max(0, goal.daysLeft)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        value={contributions[goal.id] || ""}
                        onChange={(event) =>
                          setContributions((current) => ({
                            ...current,
                            [goal.id]: event.target.value,
                          }))
                        }
                        className="input-class h-10 flex-1 px-3 text-14"
                        min="1"
                        placeholder="Add saved amount"
                        type="number"
                      />
                      <button
                        type="button"
                        onClick={() => addContribution(goal)}
                        className="flex-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 text-13 font-semibold text-blue-700 hover:border-blue-200"
                      >
                        <Plus size={15} />
                        Add
                      </button>
                    </div>

                    <div className="mt-4 rounded-lg bg-gray-25 p-3">
                      <div className="flex items-start gap-2">
                        {goal.status === "completed" ? (
                          <CheckCircle2 size={16} className="mt-0.5 text-success-700" />
                        ) : (
                          <CalendarDays size={16} className="mt-0.5 text-blue-600" />
                        )}
                        <p className="text-13 text-gray-600">
                          {goal.status === "completed"
                            ? "This goal is complete."
                            : goal.status === "behind"
                            ? "This goal needs more regular saving to reach the deadline."
                            : goal.status === "on-track"
                            ? "This goal is moving at a healthy pace."
                            : "Add a deadline to see weekly and monthly saving targets."}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Target size={42} className="text-gray-400" strokeWidth={1.5} />
              <h2 className="mt-4 text-20 font-bold text-gray-900">No savings goals yet</h2>
              <p className="mt-2 max-w-md text-14 text-gray-600">
                Add a goal with a target amount and deadline to see progress,
                weekly needs, and whether it is on track.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GoalsCenter;
