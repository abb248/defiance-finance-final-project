"use client";

import {
  askFinanceAssistant,
  type FinanceAssistantOverview,
} from "@/lib/actions/assistant.actions";
import {
  analyzeBudgetsFromCategorySpending,
  createPlannerId,
  getPlannerStateFromStorage,
  savePlannerStateToStorage,
  type StoredBudget,
  type StoredSavingsGoal,
} from "@/lib/budget-utils";
import { formatAmount } from "@/lib/utilsz";
import {
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type AssistantMessage = {
  role: "assistant" | "user";
  content: string;
};

type FinanceAssistantChatProps = {
  overview: FinanceAssistantOverview;
};

const demoQuestionGroups = [
  {
    label: "Spending",
    questions: [
      "What did I spend the most on this month?",
      "What are my recent transactions?",
    ],
  },
  {
    label: "Planning",
    questions: ["How are my budgets doing?", "How close am I to my savings goals?"],
  },
  {
    label: "Accounts",
    questions: ["Which account has the highest balance?", "Will my spending be high this month?"],
  },
];

const splitMessage = (content: string) =>
  content
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const FinanceAssistantChat = ({ overview }: FinanceAssistantChatProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<StoredSavingsGoal[]>([]);
  const [isPlannerLoaded, setIsPlannerLoaded] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState(
    overview.topCategories[0]?.name || "Food and Drink"
  );
  const [budgetLimit, setBudgetLimit] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [plannerNotice, setPlannerNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        overview.quickInsights[0] ||
        "I can help you understand your spending, balances, and recent transactions.",
    },
  ]);

  const plannerPreferences = useMemo(
    () => ({ budgets, savingsGoals }),
    [budgets, savingsGoals]
  );

  const budgetAnalyses = useMemo(
    () => analyzeBudgetsFromCategorySpending(budgets, overview.topCategories),
    [budgets, overview.topCategories]
  );

  const savingsGoalAnalyses = useMemo(
    () =>
      savingsGoals.map((goal) => {
        const percentage = goal.targetAmount
          ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          : 0;

        return {
          ...goal,
          remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
          percentage,
        };
      }),
    [savingsGoals]
  );

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setBudgets(planner.budgets);
    setSavingsGoals(planner.savingsGoals);
    setIsPlannerLoaded(true);
  }, []);

  useEffect(() => {
    if (!isPlannerLoaded) return;

    savePlannerStateToStorage({ budgets, savingsGoals });
  }, [budgets, isPlannerLoaded, savingsGoals]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, messages]);

  const addBudget = () => {
    const monthlyLimit = Number(budgetLimit);
    const cleanCategory = budgetCategory.trim();

    if (!cleanCategory || !monthlyLimit || monthlyLimit <= 0) {
      setPlannerNotice("Enter a category and a budget limit greater than 0.");
      return;
    }

    setBudgets((current) => [
      ...current.filter(
        (budget) => budget.category.toLowerCase() !== cleanCategory.toLowerCase()
      ),
      {
        id: createPlannerId(),
        category: cleanCategory,
        monthlyLimit,
      },
    ]);
    setBudgetLimit("");
    setPlannerNotice(`${cleanCategory} budget is ready for assistant answers.`);
  };

  const addSavingsGoal = () => {
    const targetAmount = Number(goalTarget);
    const currentAmount = Number(goalCurrent) || 0;
    const cleanName = goalName.trim();

    if (!cleanName || !targetAmount || targetAmount <= 0) {
      setPlannerNotice("Enter a goal name and a target amount greater than 0.");
      return;
    }

    setSavingsGoals((current) => [
      ...current,
      {
        id: createPlannerId(),
        name: cleanName,
        targetAmount,
        currentAmount,
      },
    ]);
    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
    setPlannerNotice(`${cleanName} goal is ready for assistant answers.`);
  };

  const submitQuestion = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: cleanQuestion }]);
    setIsLoading(true);

    try {
      const result = await askFinanceAssistant(cleanQuestion, plannerPreferences);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result?.answer || "I could not prepare an answer right now.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not read the finance data right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          overview.quickInsights[0] ||
          "I can help you understand your spending, balances, and recent transactions.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-center size-11 rounded-full bg-blue-50 text-blue-600">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-18 font-semibold text-gray-900">Finance Assistant</h2>
              <p className="text-14 text-gray-600">Personal answers from your finance data</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-12 font-semibold ${
                overview.answerMode === "gemini"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Sparkles size={14} />
              {overview.answerMode === "gemini" ? "Smart answers active" : "Basic answers active"}
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 p-5">
          <div className="mb-4 grid gap-3 lg:grid-cols-3">
            {demoQuestionGroups.map((group) => (
              <div key={group.label} className="rounded-lg border border-gray-200 bg-gray-25 p-3">
                <p className="mb-2 text-12 font-semibold uppercase text-gray-500">
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.questions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-12 font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => submitQuestion(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask about spending, accounts, or recent transactions"
              className="input-class h-12 flex-1 px-4"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="flex-center size-12 rounded-lg bg-bank-gradient text-white shadow-form disabled:opacity-60"
              disabled={isLoading || !input.trim()}
              aria-label="Send question"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

        <div className="custom-scrollbar flex max-h-[430px] flex-col gap-4 overflow-y-auto px-5 py-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-14 leading-6 ${
                  message.role === "user"
                    ? "bg-bank-gradient text-white"
                    : "border border-gray-200 bg-gray-25 text-gray-700"
                }`}
              >
                {splitMessage(message.content).map((paragraph) => (
                  <p key={paragraph} className="mb-2 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-25 px-4 py-3 text-14 text-gray-600">
                <Loader2 size={16} className="animate-spin" />
                Analyzing
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WalletCards size={18} className="text-blue-600" />
              <p className="text-12 font-semibold uppercase text-gray-500">Budget Planner</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-10 font-semibold text-gray-600">
              {budgetAnalyses.length}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {plannerNotice ? (
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-12 font-medium text-blue-700">
                {plannerNotice}
              </div>
            ) : null}
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
              <select
                value={budgetCategory}
                onChange={(event) => setBudgetCategory(event.target.value)}
                className="input-class h-11 px-3 text-14"
              >
                {Array.from(
                  new Set([
                    ...overview.topCategories.map((category) => category.name),
                    "Food and Drink",
                    "Shopping",
                    "Travel",
                    "Payment",
                    "Transfer",
                  ])
                ).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={budgetLimit}
                onChange={(event) => setBudgetLimit(event.target.value)}
                type="number"
                min="1"
                placeholder="Limit"
                className="input-class h-11 px-3 text-14"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addBudget();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={addBudget}
              className="flex-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-12 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={16} />
              Add budget
            </button>

            <div className="flex flex-col gap-3 pt-2">
              {budgetAnalyses.length ? (
                budgetAnalyses.map((budget) => (
                  <div key={budget.id} className="rounded-lg bg-gray-25 p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-14 font-semibold text-gray-800">
                          {budget.category}
                        </p>
                        <p className="text-12 text-gray-600">
                          {formatAmount(Math.max(0, budget.remaining))} left from{" "}
                          {formatAmount(budget.monthlyLimit)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${budget.category} budget`}
                        onClick={() =>
                          setBudgets((current) =>
                            current.filter((item) => item.id !== budget.id)
                          )
                        }
                        className="text-gray-500 transition-colors hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          budget.percentage >= 100
                            ? "bg-red-500"
                            : budget.percentage >= 80
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-12 text-gray-600">{budget.percentage}% used</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-25 p-3">
                  <p className="text-13 font-semibold text-gray-700">No budget yet</p>
                  <p className="mt-1 text-12 text-gray-600">
                    Add one category limit to get risk alerts in the assistant.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-emerald-600" />
              <p className="text-12 font-semibold uppercase text-gray-500">Savings Goals</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-10 font-semibold text-gray-600">
              {savingsGoalAnalyses.length}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <input
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Goal name"
              className="input-class h-11 px-3 text-14"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={goalTarget}
                onChange={(event) => setGoalTarget(event.target.value)}
                type="number"
                min="1"
                placeholder="Target"
                className="input-class h-11 px-3 text-14"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSavingsGoal();
                  }
                }}
              />
              <input
                value={goalCurrent}
                onChange={(event) => setGoalCurrent(event.target.value)}
                type="number"
                min="0"
                placeholder="Saved"
                className="input-class h-11 px-3 text-14"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSavingsGoal();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={addSavingsGoal}
              className="flex-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-12 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={16} />
              Add goal
            </button>

            <div className="flex flex-col gap-3 pt-2">
              {savingsGoalAnalyses.length ? (
                savingsGoalAnalyses.map((goal) => (
                  <div key={goal.id} className="rounded-lg bg-gray-25 p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-14 font-semibold text-gray-800">
                          {goal.name}
                        </p>
                        <p className="text-12 text-gray-600">
                          {formatAmount(goal.remaining)} left to reach{" "}
                          {formatAmount(goal.targetAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${goal.name} goal`}
                        onClick={() =>
                          setSavingsGoals((current) =>
                            current.filter((item) => item.id !== goal.id)
                          )
                        }
                        className="text-gray-500 transition-colors hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-12 text-gray-600">{goal.percentage}% complete</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-25 p-3">
                  <p className="text-13 font-semibold text-gray-700">No goal yet</p>
                  <p className="mt-1 text-12 text-gray-600">
                    Add a target amount to get progress advice during the demo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-12 font-semibold uppercase text-gray-500">This Month</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-25 p-3">
              <p className="text-12 text-gray-600">Spent</p>
              <p className="mt-1 text-18 font-bold text-gray-900">
                {formatAmount(overview.monthSpent)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-25 p-3">
              <p className="text-12 text-gray-600">Income</p>
              <p className="mt-1 text-18 font-bold text-gray-900">
                {formatAmount(overview.monthIncome)}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-blue-50 p-3">
            <p className="text-12 text-blue-700">Projected spending</p>
            <p className="mt-1 text-18 font-bold text-blue-900">
              {formatAmount(overview.projectedMonthSpending)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-12 font-semibold uppercase text-gray-500">Top Categories</p>
          <div className="mt-4 flex flex-col gap-3">
            {overview.topCategories.length ? (
              overview.topCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="truncate text-14 font-semibold text-gray-700">{category.name}</p>
                    <p className="text-12 text-gray-600">{category.percentage}%</p>
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
              <p className="text-14 text-gray-600">No category spending yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-12 font-semibold uppercase text-gray-500">Accounts</p>
          <div className="mt-4 flex flex-col gap-3">
            {overview.accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-14 font-semibold text-gray-700">{account.name}</p>
                  <p className="truncate text-12 text-gray-500">{account.bankName}</p>
                </div>
                <p className="text-14 font-bold text-gray-900">{formatAmount(account.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default FinanceAssistantChat;
