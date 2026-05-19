"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

import type { FinancialReport } from "@/lib/report-utils";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

type ReportsChartsProps = {
  report: FinancialReport;
};

const chartColors = ["#1570EF", "#12B76A", "#F79009", "#F04438", "#7A5AF8", "#06AED4"];

const sharedOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        boxWidth: 10,
        color: "#475467",
        font: {
          size: 12,
          weight: "bold" as const,
        },
      },
    },
  },
};

const ReportsCharts = ({ report }: ReportsChartsProps) => {
  const categoryData = {
    labels: report.categoryBreakdown.map((category) => category.name),
    datasets: [
      {
        label: "Spending",
        data: report.categoryBreakdown.map((category) => category.amount),
        backgroundColor: chartColors,
        borderRadius: 8,
      },
    ],
  };

  const trendData = {
    labels: report.monthlyTrend.map((month) => month.month),
    datasets: [
      {
        label: "Income",
        data: report.monthlyTrend.map((month) => month.income),
        borderColor: "#12B76A",
        backgroundColor: "rgba(18, 183, 106, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: "Spending",
        data: report.monthlyTrend.map((month) => month.spending),
        borderColor: "#F04438",
        backgroundColor: "rgba(240, 68, 56, 0.10)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };

  const accountData = {
    labels: report.accountActivity.slice(0, 6).map((account) => account.name),
    datasets: [
      {
        label: "Transactions",
        data: report.accountActivity.slice(0, 6).map((account) => account.transactionCount),
        backgroundColor: "#175CD3",
        borderRadius: 8,
      },
    ],
  };

  const netData = {
    labels: ["Income", "Spending", "Net"],
    datasets: [
      {
        label: report.monthLabel,
        data: [
          report.currentMonthIncome,
          report.currentMonthSpending,
          Math.abs(report.currentMonthNet),
        ],
        backgroundColor: ["#12B76A", "#F04438", "#1570EF"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-12 font-semibold uppercase text-gray-500">Categories</p>
            <h2 className="mt-1 text-18 font-bold text-gray-900">Spending by category</h2>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-12 font-semibold text-blue-700">
            {report.monthLabel}
          </span>
        </div>
        <div className="h-[300px]">
          {report.categoryBreakdown.length ? (
            <Bar
              data={categoryData}
              options={{
                ...sharedOptions,
                plugins: { ...sharedOptions.plugins, legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#667085" } },
                  y: { beginAtZero: true, grid: { color: "#EAECF0" } },
                },
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-gray-25 text-14 text-gray-600">
              No spending data for this month yet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-12 font-semibold uppercase text-gray-500">Trend</p>
            <h2 className="mt-1 text-18 font-bold text-gray-900">Income vs spending</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-12 font-semibold text-gray-600">
            Last 6 months
          </span>
        </div>
        <div className="h-[300px]">
          <Line
            data={trendData}
            options={{
              ...sharedOptions,
              scales: {
                x: { grid: { display: false }, ticks: { color: "#667085" } },
                y: { beginAtZero: true, grid: { color: "#EAECF0" } },
              },
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-12 font-semibold uppercase text-gray-500">Cash flow</p>
            <h2 className="mt-1 text-18 font-bold text-gray-900">Income, spending, net</h2>
          </div>
        </div>
        <div className="mx-auto h-[280px] max-w-[360px]">
          <Doughnut
            data={netData}
            options={{
              ...sharedOptions,
              cutout: "62%",
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-12 font-semibold uppercase text-gray-500">Accounts</p>
            <h2 className="mt-1 text-18 font-bold text-gray-900">Most active accounts</h2>
          </div>
        </div>
        <div className="h-[280px]">
          {report.accountActivity.length ? (
            <Bar
              data={accountData}
              options={{
                ...sharedOptions,
                indexAxis: "y" as const,
                plugins: { ...sharedOptions.plugins, legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, grid: { color: "#EAECF0" } },
                  y: { grid: { display: false }, ticks: { color: "#667085" } },
                },
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-gray-25 text-14 text-gray-600">
              No account activity yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReportsCharts;
