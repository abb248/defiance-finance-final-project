"use client"; // Buton tıklaması (onClick) için client component olması gerekiyor

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Gauge, Target, WalletCards } from 'lucide-react'
import Category from '@/components/Category'
import BankCard from '@/components/ui/BankCard'
import {
  analyzeBudgetsFromTransactions,
  analyzeSavingsGoals,
  analyzeSubscriptions,
  getCurrentMonthCategorySpending,
  getPlannerStateFromStorage,
  type StoredBudget,
  type StoredSavingsGoal,
  type StoredSubscription,
} from '@/lib/budget-utils'
import { buildFinancialAlerts } from '@/lib/alert-utils'
import { buildFinancialHealthInsight } from '@/lib/insight-utils'
import { cn, countTransactionCategories, formatAmount } from '@/lib/utilsz'
import { createConnectSession, createSaltEdgeCustomer } from '@/lib/actions/saltedge.actions' // Salt Edge oturum oluşturma fonksiyonunu import ettik



const RightSidebar = ({ user, banks = [], transactions = [] }: RightSidebarProps) => {
  const router = useRouter();
  const categories = countTransactionCategories(transactions);
  const [budgets, setBudgets] = useState<StoredBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<StoredSavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<StoredSubscription[]>([]);
  const budgetAnalyses = useMemo(
    () => analyzeBudgetsFromTransactions(budgets, transactions),
    [budgets, transactions]
  );
  const savingsGoalAnalyses = useMemo(
    () => analyzeSavingsGoals(savingsGoals),
    [savingsGoals]
  );
  const subscriptionAnalyses = useMemo(
    () => analyzeSubscriptions(subscriptions),
    [subscriptions]
  );
  const budgetRisk = budgetAnalyses.find((budget) => budget.status !== 'good') || budgetAnalyses[0];
  const goalFocus =
    savingsGoalAnalyses.find((goal) => goal.status === 'behind') || savingsGoalAnalyses[0];
  const sidebarReport = useMemo(() => {
    const categoryBreakdown = getCurrentMonthCategorySpending(transactions);
    const monthSpending = categoryBreakdown.reduce((sum, category) => sum + category.amount, 0);

    return {
      monthLabel: "",
      previousMonthLabel: "",
      currentMonthIncome: 0,
      currentMonthSpending: monthSpending,
      currentMonthNet: -monthSpending,
      previousMonthSpending: 0,
      spendingChangePercent: 0,
      totalCurrentBalance: banks.reduce(
        (sum, bank) => sum + (Number(bank.currentBalance) || 0),
        0
      ),
      transactionCount: transactions.length,
      averageExpense: transactions.length ? monthSpending / transactions.length : 0,
      categoryBreakdown,
      monthlyTrend: [],
      accountActivity: banks.map((bank) => ({
        id: bank.supabaseItemId,
        name: bank.name || "Bank account",
        bankName: bank.bankName || "Connected bank",
        balance: Number(bank.currentBalance) || 0,
        income: 0,
        spending: 0,
        transactionCount: 0,
      })),
      largestExpense: null,
      topCategory: categoryBreakdown[0] || null,
      mostActiveAccount: null,
      reportSummary: [],
      assistantQuestion: "",
    };
  }, [banks, transactions]);
  const healthInsight = useMemo(
    () =>
      buildFinancialHealthInsight({
        report: sidebarReport,
        budgets: budgetAnalyses,
        goals: savingsGoalAnalyses,
      }),
    [budgetAnalyses, savingsGoalAnalyses, sidebarReport]
  );
  const alertPreview = useMemo(
    () =>
      buildFinancialAlerts({
        report: sidebarReport,
      budgets: budgetAnalyses,
      goals: savingsGoalAnalyses,
      subscriptions: subscriptionAnalyses,
      }),
    [budgetAnalyses, savingsGoalAnalyses, sidebarReport, subscriptionAnalyses]
  );
  const topAlert = alertPreview[0];
  const upcomingSubscription =
    subscriptionAnalyses.find((subscription) => subscription.status !== 'paid') ||
    subscriptionAnalyses[0];

  const firstInitial = (user?.firstName?.trim()?.[0] || user?.email?.trim()?.[0] || 'U').toUpperCase()
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'User'

  useEffect(() => {
    const planner = getPlannerStateFromStorage();
    setBudgets(planner.budgets);
    setSavingsGoals(planner.savingsGoals);
    setSubscriptions(planner.subscriptions);
  }, []);

  const handleAddBank = async () => {
    try {
      console.log("1. İstek atılıyor: ", user.email);

      // 1. Müşteri Oluştur
      const customer = await createSaltEdgeCustomer(user.email);
      console.log("2. Salt Edge customer:", customer);

      const customerId = customer?.customer_id || customer?.id;
      if (!customer || !customerId) {
        alert("HATA: Salt Edge müşteri oluşturamadı! VS Code terminaline (siyah ekrana) bak, API hatası dönmüş olabilir.");
        return;
      }

      // 2. Link Üret
      const connectUrl = await createConnectSession(String(customerId), window.location.origin);
      console.log("3. Salt Edge connect_url:", connectUrl);

      if (!connectUrl) {
        alert("HATA: Müşteri oluştu ama Salt Edge banka linki vermedi! VS Code terminalini kontrol et.");
        return;
      }

      // 3. Başarılıysa Yönlendir
      // Salt Edge connect_url harici bir domain olabiliyor; Next router.push bazen engelleyebiliyor.
      window.location.assign(connectUrl);

    } catch (error) {
      console.error("Banka bağlama ekranı açılamadı", error);
      const message =
        error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');
      alert(`Beklenmeyen bir hata oluştu: ${message}\n\nTarayıcıda F12 → Console ve terminali kontrol et.`);
    }
  }
  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />

        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-bold text-blue-500">
              {firstInitial}
            </span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">
              {fullName}
            </h1>
            <p className="profile-email">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <section className="banks">
        <div className="flex w-full justify-between">
          <h2 className="header-2">My Banks</h2>

          {/* Link yerine Button kullandık ve onClick ekledik */}
          <button
            type="button"
            onClick={handleAddBank}
            className="flex gap-2 items-center cursor-pointer bg-transparent border-none p-0"
          >
            <Image
              src="/icons/plus.svg"
              width={20}
              height={20}
              alt="plus"
            />
            <h2 className="text-14 font-semibold text-gray-600">
              Add Bank
            </h2>
          </button>
        </div>

        {banks?.length > 0 && (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
            <div className="relative z-10">
              <BankCard
                key={banks[0].id}
                account={banks[0]}
                userName={fullName}
                showBalance={false}
                variant="sidebar"
              />
            </div>

            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1].id}
                  account={banks[1]}
                  userName={fullName}
                  showBalance={false}
                  variant="sidebar"
                />
              </div>
            )}
          </div>
        )}

        <div className="spending-categories">
          <div className="flex items-center justify-between gap-3">
            <h2 className="header-2">Health Score</h2>
            <Link href="/insights" className="text-13 font-semibold text-blue-600">
              Details
            </Link>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">
                  Financial health
                </p>
                <p className="mt-1 text-30 font-bold text-gray-900">
                  {healthInsight.score}
                </p>
              </div>
              <div
                className={cn('flex-center size-12 rounded-full', {
                  'bg-success-50 text-success-700': healthInsight.status === 'strong',
                  'bg-blue-50 text-blue-600': healthInsight.status === 'steady',
                  'bg-red-50 text-red-600': healthInsight.status === 'needs-attention',
                })}
              >
                <Gauge size={21} />
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn('h-full rounded-full', {
                  'bg-success-600': healthInsight.status === 'strong',
                  'bg-blue-600': healthInsight.status === 'steady',
                  'bg-red-500': healthInsight.status === 'needs-attention',
                })}
                style={{ width: `${healthInsight.score}%` }}
              />
            </div>
            <p className="mt-2 text-12 font-medium text-gray-600">
              {healthInsight.statusLabel}
            </p>
          </div>
        </div>

        <div className="spending-categories">
          <div className="flex items-center justify-between gap-3">
            <h2 className="header-2">Alerts</h2>
            <Link href="/alerts" className="text-13 font-semibold text-blue-600">
              View all
            </Link>
          </div>

          {topAlert ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('rounded-full px-2 py-1 text-10 font-semibold', {
                        'bg-red-50 text-red-700': topAlert.severity === 'high',
                        'bg-amber-50 text-amber-700': topAlert.severity === 'medium',
                        'bg-blue-50 text-blue-700': topAlert.severity === 'low',
                      })}
                    >
                      {topAlert.severity}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-14 font-semibold text-gray-800">
                    {topAlert.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-12 text-gray-600">
                    {topAlert.detail}
                  </p>
                </div>
                <div
                  className={cn('flex-center size-9 rounded-full', {
                    'bg-red-50 text-red-600': topAlert.severity === 'high',
                    'bg-amber-50 text-amber-600': topAlert.severity === 'medium',
                    'bg-blue-50 text-blue-600': topAlert.severity === 'low',
                  })}
                >
                  <AlertTriangle size={17} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-14 text-gray-600">
              No alerts right now.
            </div>
          )}
        </div>

        <div className="spending-categories">
          <div className="flex items-center justify-between gap-3">
            <h2 className="header-2">Upcoming Bills</h2>
            <Link href="/subscriptions" className="text-13 font-semibold text-blue-600">
              Manage
            </Link>
          </div>

          {upcomingSubscription ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-14 font-semibold text-gray-800">
                    {upcomingSubscription.name}
                  </p>
                  <p className="mt-1 text-12 text-gray-600">
                    {formatAmount(upcomingSubscription.amount)} •{' '}
                    {upcomingSubscription.daysUntilDue < 0
                      ? `${Math.abs(upcomingSubscription.daysUntilDue)} days late`
                      : `${upcomingSubscription.daysUntilDue} days left`}
                  </p>
                </div>
                <div
                  className={cn('flex-center size-9 rounded-full', {
                    'bg-red-50 text-red-600': upcomingSubscription.status === 'overdue',
                    'bg-amber-50 text-amber-600': upcomingSubscription.status === 'due-soon',
                    'bg-success-50 text-success-700': upcomingSubscription.status === 'paid',
                    'bg-blue-50 text-blue-600': upcomingSubscription.status === 'scheduled',
                  })}
                >
                  <WalletCards size={17} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-14 text-gray-600">
              Add bills to see upcoming payment reminders.
            </div>
          )}
        </div>

        <div className="spending-categories">
          <h2 className="header-2">Top Categories</h2>

          {categories.length > 0 ? (
            <div className="space-y-5">
              {categories.map((category, index) => (
                <Category
                  key={category.name}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 text-center text-14 text-gray-600">
              No spending categories yet.
            </div>
          )}
        </div>

        <div className="spending-categories">
          <div className="flex items-center justify-between gap-3">
            <h2 className="header-2">Budget Watch</h2>
            <Link href="/budgets" className="text-13 font-semibold text-blue-600">
              Manage
            </Link>
          </div>

          {budgetRisk ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-14 font-semibold text-gray-800">
                    {budgetRisk.category}
                  </p>
                  <p className="mt-1 text-12 text-gray-600">
                    {formatAmount(Math.max(0, budgetRisk.remaining))} left from{' '}
                    {formatAmount(budgetRisk.monthlyLimit)}
                  </p>
                </div>
                <div
                  className={cn('flex-center size-9 rounded-full', {
                    'bg-blue-50 text-blue-600': budgetRisk.status === 'good',
                    'bg-amber-50 text-amber-600': budgetRisk.status === 'watch',
                    'bg-red-50 text-red-600': budgetRisk.status === 'over',
                  })}
                >
                  {budgetRisk.status === 'good' ? (
                    <WalletCards size={17} />
                  ) : (
                    <AlertTriangle size={17} />
                  )}
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn('h-full rounded-full', {
                    'bg-blue-600': budgetRisk.status === 'good',
                    'bg-amber-500': budgetRisk.status === 'watch',
                    'bg-red-500': budgetRisk.status === 'over',
                  })}
                  style={{ width: `${Math.min(budgetRisk.percentage, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-12 font-medium text-gray-600">
                {budgetRisk.percentage}% used this month
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-14 text-gray-600">
              Add a category limit to track budget risk from the dashboard.
            </div>
          )}
        </div>

        <div className="spending-categories">
          <div className="flex items-center justify-between gap-3">
            <h2 className="header-2">Goals Watch</h2>
            <Link href="/goals" className="text-13 font-semibold text-blue-600">
              Manage
            </Link>
          </div>

          {goalFocus ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-14 font-semibold text-gray-800">
                    {goalFocus.name}
                  </p>
                  <p className="mt-1 text-12 text-gray-600">
                    {formatAmount(goalFocus.remaining)} left from{' '}
                    {formatAmount(goalFocus.targetAmount)}
                  </p>
                </div>
                <div
                  className={cn('flex-center size-9 rounded-full', {
                    'bg-success-50 text-success-700': goalFocus.status === 'completed',
                    'bg-blue-50 text-blue-600': goalFocus.status === 'on-track',
                    'bg-red-50 text-red-600': goalFocus.status === 'behind',
                    'bg-gray-100 text-gray-600': goalFocus.status === 'no-date',
                  })}
                >
                  <Target size={17} />
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn('h-full rounded-full', {
                    'bg-success-600': goalFocus.status === 'completed',
                    'bg-blue-600': goalFocus.status === 'on-track',
                    'bg-red-500': goalFocus.status === 'behind',
                    'bg-gray-500': goalFocus.status === 'no-date',
                  })}
                  style={{ width: `${goalFocus.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-12 font-medium text-gray-600">
                {goalFocus.percentage}% complete
                {goalFocus.daysLeft !== null
                  ? `, ${Math.max(0, goalFocus.daysLeft)} days left`
                  : ''}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-14 text-gray-600">
              Add a savings goal to track progress from the dashboard.
            </div>
          )}
        </div>
      </section>
    </aside>
  )
}

export default RightSidebar
