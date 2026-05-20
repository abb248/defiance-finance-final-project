"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  ReceiptText,
  Repeat,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  analyzeSubscriptions,
  createPlannerId,
  getBudgetCategoryOptions,
  getPlannerStateFromStorage,
  savePlannerStateToStorage,
  type StoredBudget,
  type StoredSavingsGoal,
  type StoredSubscription,
  type SubscriptionAnalysis,
} from "@/lib/budget-utils";
import { cn, formatAmount } from "@/lib/utilsz";

type SubscriptionsCenterProps = {
  accounts: Account[];
  transactions: Transaction[];
};

const statusTone: Record<SubscriptionAnalysis["status"], string> = {
  overdue: "bg-red-50 text-red-700",
  "due-soon": "bg-amber-50 text-amber-700",
  paid: "bg-success-50 text-success-700",
  scheduled: "bg-blue-50 text-blue-700",
};

const SubscriptionsCenter = ({ accounts, transactions }: SubscriptionsCenterProps) => {
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<StoredSavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<StoredSubscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Payment");
  const [dueDate, setDueDate] = useState("");
  const [frequency, setFrequency] = useState<StoredSubscription["frequency"]>("monthly");
  const [accountName, setAccountName] = useState("");
  const [notice, setNotice] = useState("");

  const subscriptionAnalyses = useMemo(
    () => analyzeSubscriptions(subscriptions),
    [subscriptions]
  );
  const categoryOptions = useMemo(
    () =>
      getBudgetCategoryOptions(
        transactions,
        subscriptions.map((subscription) => subscription.category)
      ),
    [subscriptions, transactions]
  );
  const monthlyTotal = subscriptionAnalyses.reduce(
    (sum, subscription) => sum + subscription.monthlyAmount,
    0
  );
  const yearlyTotal = subscriptionAnalyses.reduce(
    (sum, subscription) => sum + subscription.yearlyAmount,
    0
  );
  const dueSoonCount = subscriptionAnalyses.filter(
    (subscription) => subscription.status === "due-soon"
  ).length;
  const overdueCount = subscriptionAnalyses.filter(
    (subscription) => subscription.status === "overdue"
  ).length;

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
    if (!accountName && accounts[0]?.name) {
      setAccountName(accounts[0].name);
    }
  }, [accountName, accounts]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setCategory(categoryOptions[0] || "Payment");
    setDueDate("");
    setFrequency("monthly");
    setAccountName(accounts[0]?.name || "");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanAmount = Number(amount);

    if (!cleanName || !cleanAmount || cleanAmount <= 0 || !dueDate) {
      setNotice("Enter a bill name, amount, and due date.");
      return;
    }

    setSubscriptions((current) => {
      if (editingId) {
        return current.map((subscription) =>
          subscription.id === editingId
            ? {
                ...subscription,
                name: cleanName,
                amount: cleanAmount,
                category,
                dueDate,
                frequency,
                accountName: accountName || undefined,
              }
            : subscription
        );
      }

      return [
        ...current,
        {
          id: createPlannerId(),
          name: cleanName,
          amount: cleanAmount,
          category,
          dueDate,
          frequency,
          accountName: accountName || undefined,
          isPaid: false,
        },
      ];
    });

    setNotice(editingId ? `${cleanName} was updated.` : `${cleanName} was added.`);
    resetForm();
  };

  const startEditing = (subscription: StoredSubscription) => {
    setEditingId(subscription.id);
    setName(subscription.name);
    setAmount(String(subscription.amount));
    setCategory(subscription.category);
    setDueDate(subscription.dueDate);
    setFrequency(subscription.frequency);
    setAccountName(subscription.accountName || accounts[0]?.name || "");
    setNotice(`Editing ${subscription.name}.`);
  };

  const removeSubscription = (subscription: StoredSubscription) => {
    setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
    setNotice(`${subscription.name} was removed.`);
  };

  const togglePaid = (subscription: StoredSubscription) => {
    setSubscriptions((current) =>
      current.map((item) =>
        item.id === subscription.id ? { ...item, isPaid: !item.isPaid } : item
      )
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Monthly fixed cost</p>
            <Repeat size={18} className="text-blue-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{formatAmount(monthlyTotal)}</p>
          <p className="mt-1 text-13 text-gray-600">{subscriptionAnalyses.length} tracked bills</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Yearly estimate</p>
            <ReceiptText size={18} className="text-indigo-700" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{formatAmount(yearlyTotal)}</p>
          <p className="mt-1 text-13 text-gray-600">Estimated recurring spend</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Due soon</p>
            <Clock3 size={18} className="text-amber-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{dueSoonCount}</p>
          <p className="mt-1 text-13 text-gray-600">Due in the next 7 days</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-12 font-semibold uppercase text-gray-500">Overdue</p>
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="mt-3 text-24 font-bold text-gray-900">{overdueCount}</p>
          <p className="mt-1 text-13 text-gray-600">Needs payment review</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-12 font-semibold uppercase text-gray-500">Bill setup</p>
              <h2 className="mt-1 text-20 font-bold text-gray-900">
                {editingId ? "Update recurring bill" : "Add recurring bill"}
              </h2>
            </div>
            {editingId ? (
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
              <span className="text-13 font-semibold text-gray-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-class h-11 px-3 text-14"
                placeholder="Example: Internet bill"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Amount</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                  min="1"
                  placeholder="75"
                  type="number"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Due date</span>
                <input
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                  type="date"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-13 font-semibold text-gray-700">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input-class h-11 px-3 text-14"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Frequency</span>
                <select
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(event.target.value as StoredSubscription["frequency"])
                  }
                  className="input-class h-11 px-3 text-14"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-13 font-semibold text-gray-700">Account</span>
                <select
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  className="input-class h-11 px-3 text-14"
                >
                  {accounts.length ? (
                    accounts.map((account) => (
                      <option key={account.supabaseItemId} value={account.name || "Bank account"}>
                        {account.name || "Bank account"}
                      </option>
                    ))
                  ) : (
                    <option value="">No account</option>
                  )}
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="flex-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-14 font-semibold text-white shadow-form transition-colors hover:bg-blue-700"
            >
              <Plus size={16} />
              {editingId ? "Update bill" : "Add bill"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          {subscriptionAnalyses.length ? (
            subscriptionAnalyses.map((subscription) => (
              <article
                key={subscription.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-18 font-bold text-gray-900">
                        {subscription.name}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-10 font-semibold",
                          statusTone[subscription.status]
                        )}
                      >
                        {subscription.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-13 text-gray-600">
                      {subscription.accountName || "No account"} • {subscription.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(subscription)}
                      aria-label={`Edit ${subscription.name}`}
                      className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSubscription(subscription)}
                      aria-label={`Remove ${subscription.name}`}
                      className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-gray-25 p-3">
                    <p className="text-12 text-gray-600">Amount</p>
                    <p className="mt-1 text-16 font-bold text-gray-900">
                      {formatAmount(subscription.amount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-25 p-3">
                    <p className="text-12 text-gray-600">Monthly cost</p>
                    <p className="mt-1 text-16 font-bold text-gray-900">
                      {formatAmount(subscription.monthlyAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-25 p-3">
                    <p className="text-12 text-gray-600">Due</p>
                    <p className="mt-1 text-16 font-bold text-gray-900">
                      {subscription.daysUntilDue < 0
                        ? `${Math.abs(subscription.daysUntilDue)}d late`
                        : `${subscription.daysUntilDue}d`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-25 p-3">
                    <p className="text-12 text-gray-600">Frequency</p>
                    <p className="mt-1 text-16 font-bold capitalize text-gray-900">
                      {subscription.frequency}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => togglePaid(subscription)}
                    className={cn(
                      "flex-center gap-2 rounded-lg px-3 py-2 text-13 font-semibold",
                      subscription.isPaid
                        ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-success-600 text-white hover:bg-success-700"
                    )}
                  >
                    <CheckCircle2 size={14} />
                    {subscription.isPaid ? "Mark unpaid" : "Mark paid"}
                  </button>
                  <div className="flex-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-13 font-semibold text-blue-700">
                    <CalendarClock size={14} />
                    {subscription.dueDate}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Repeat size={42} className="text-gray-400" strokeWidth={1.5} />
              <h2 className="mt-4 text-20 font-bold text-gray-900">No recurring bills yet</h2>
              <p className="mt-2 max-w-md text-14 text-gray-600">
                Add subscriptions or monthly bills to see due dates, monthly fixed costs,
                and alerts before payments are late.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SubscriptionsCenter;
