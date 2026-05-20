"use client";

import { CalendarDays, CreditCard, Hash, Tag, X } from "lucide-react";
import { KeyboardEvent, useMemo, useState } from "react";

import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utilsz";

const categoryStyles: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    dot: string;
  }
> = {
  posted: {
    border: "border-success-600",
    bg: "bg-success-50",
    text: "text-success-700",
    dot: "bg-success-600",
  },
  pending: {
    border: "border-[#FDB022]",
    bg: "bg-[#FFFAEB]",
    text: "text-[#B54708]",
    dot: "bg-[#FDB022]",
  },
  transfer: {
    border: "border-blue-600",
    bg: "bg-blue-25",
    text: "text-blue-700",
    dot: "bg-blue-600",
  },
  travel: {
    border: "border-blue-600",
    bg: "bg-blue-25",
    text: "text-blue-700",
    dot: "bg-blue-600",
  },
  payment: {
    border: "border-success-600",
    bg: "bg-success-50",
    text: "text-success-700",
    dot: "bg-success-600",
  },
  "food and drink": {
    border: "border-[#F04438]",
    bg: "bg-[#FEF3F2]",
    text: "text-[#B42318]",
    dot: "bg-[#F04438]",
  },
  shopping: {
    border: "border-[#7F56D9]",
    bg: "bg-[#F4F3FF]",
    text: "text-[#6941C6]",
    dot: "bg-[#7F56D9]",
  },
  "bank fees": {
    border: "border-[#667085]",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-500",
  },
  uncategorized: {
    border: "border-gray-300",
    bg: "bg-gray-25",
    text: "text-gray-700",
    dot: "bg-gray-500",
  },
  default: {
    border: "border-pink-600",
    bg: "bg-pink-25",
    text: "text-pink-700",
    dot: "bg-pink-600",
  },
};

const normalizeCategory = (category?: string) =>
  (category || "uncategorized").toLowerCase().replace(/_/g, " ");

const removeSpecialCharacters = (value: string) =>
  value.replace(/[^\w\s.,'-]/g, "").replace(/\s+/g, " ").trim();

const formatDate = (date?: string) => {
  if (!date) return "No date";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatTransactionAmount = (transaction: Transaction) => {
  const currency = transaction.currencyCode || "USD";
  const signedAmount =
    typeof transaction.signedAmount === "number"
      ? transaction.signedAmount
      : transaction.type === "debit"
      ? -transaction.amount
      : transaction.amount;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(signedAmount);
};

const getSignedAmount = (transaction: Transaction) => {
  if (typeof transaction.signedAmount === "number") return transaction.signedAmount;
  return transaction.type === "debit"
    ? -Math.abs(Number(transaction.amount) || 0)
    : Number(transaction.amount) || 0;
};

const getTransactionType = (transaction: Transaction) =>
  getSignedAmount(transaction) < 0 ? "Debit" : "Credit";

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const normalized = normalizeCategory(category);
  const styles = categoryStyles[normalized] || categoryStyles.default;

  return (
    <div className={cn("category-badge", styles.border, styles.bg)}>
      <div className={cn("size-2 rounded-full", styles.dot)} />
      <p className={cn("text-12 font-medium capitalize", styles.text)}>
        {normalized}
      </p>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div className="rounded-lg border border-gray-200 bg-gray-25 p-3">
    <p className="text-12 font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 break-words text-14 font-semibold text-gray-800">
      {value || "Not available"}
    </p>
  </div>
);

const TransactionsTable = ({
  transactions = [],
  showAccount = false,
  emptyMessage = "No transactions found for this account yet.",
}: TransactionTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(
    null
  );

  const selectedDetails = useMemo(() => {
    if (!selectedTransaction) return null;

    return {
      isDebit: getSignedAmount(selectedTransaction) < 0,
      title: removeSpecialCharacters(selectedTransaction.name),
      amount: formatTransactionAmount(selectedTransaction),
      type: getTransactionType(selectedTransaction),
      date: formatDate(selectedTransaction.date),
      channel: normalizeCategory(selectedTransaction.paymentChannel),
      category: selectedTransaction.category || "Uncategorized",
      status: selectedTransaction.status || "Unknown",
      accountId: selectedTransaction.accountId || "Not available",
      currency: selectedTransaction.currencyCode || "USD",
      reference: selectedTransaction.id,
    };
  }, [selectedTransaction]);

  const openDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    transaction: Transaction
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails(transaction);
    }
  };

  if (!transactions.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-14 text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-[#F9FAFB]">
            <tr className="text-left text-12 font-semibold uppercase text-gray-600">
              <th className="px-4 py-3">Transaction</th>
              {showAccount ? (
                <th className="px-4 py-3 max-lg:hidden">Account</th>
              ) : null}
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 max-md:hidden">Channel</th>
              <th className="px-4 py-3 max-md:hidden">Category</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => {
              const isDebit = getSignedAmount(transaction) < 0;
              const amount = formatTransactionAmount(transaction);

              return (
                <tr
                  key={transaction.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(transaction)}
                  onKeyDown={(event) => handleRowKeyDown(event, transaction)}
                  title="View transaction details"
                  className={cn(
                    "cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-blue-25 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
                    {
                      "bg-[#FFFBFA]": isDebit,
                      "bg-[#F6FEF9]": !isDebit,
                    }
                  )}
                >
                  <td className="max-w-[250px] px-4 py-4 pr-10">
                    <p className="truncate text-14 font-semibold text-gray-700">
                      {removeSpecialCharacters(transaction.name)}
                    </p>
                    <p className="mt-1 text-12 font-medium text-blue-600">
                      View details
                    </p>
                  </td>

                  {showAccount ? (
                    <td className="max-w-[180px] px-4 py-4 pr-10 text-14 text-gray-600 max-lg:hidden">
                      <p className="truncate font-semibold text-gray-700">
                        {transaction.accountName || "Bank account"}
                      </p>
                      <p className="truncate text-12 text-gray-500">
                        {transaction.accountId || "Account"}
                      </p>
                    </td>
                  ) : null}

                  <td
                    className={cn("px-4 py-4 pr-10 text-14 font-semibold", {
                      "text-[#F04438]": isDebit,
                      "text-success-700": !isDebit,
                    })}
                  >
                    {amount}
                  </td>

                  <td className="px-4 py-4 pr-10">
                    <CategoryBadge category={transaction.status} />
                  </td>

                  <td className="min-w-32 px-4 py-4 pr-10 text-14 text-gray-600">
                    {formatDate(transaction.date)}
                  </td>

                  <td className="px-4 py-4 pr-10 text-14 capitalize text-gray-600 max-md:hidden">
                    {normalizeCategory(transaction.paymentChannel)}
                  </td>

                  <td className="px-4 py-4 pr-10 max-md:hidden">
                    <CategoryBadge category={transaction.category} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full max-w-[480px] flex-col overflow-y-auto p-0 sm:max-w-[480px]"
        >
          {selectedDetails ? (
            <div className="flex min-h-full flex-col">
              <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-12 font-semibold uppercase text-gray-500">
                      Transaction details
                    </p>
                    <h2 className="mt-2 text-20 font-bold text-gray-900">
                      {selectedDetails.title}
                    </h2>
                  </div>
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="flex-center size-9 rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                      aria-label="Close transaction details"
                    >
                      <X size={18} />
                    </button>
                  </SheetClose>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-5 px-6 py-5">
                <div
                  className={cn(
                    "rounded-xl border p-5",
                    selectedDetails.isDebit
                      ? "border-red-100 bg-[#FFFBFA]"
                      : "border-green-100 bg-[#F6FEF9]"
                  )}
                >
                  <p className="text-12 font-semibold uppercase text-gray-500">
                    Amount
                  </p>
                  <p
                    className={cn("mt-2 text-30 font-bold", {
                      "text-[#F04438]": selectedDetails.isDebit,
                      "text-success-700": !selectedDetails.isDebit,
                    })}
                  >
                    {selectedDetails.amount}
                  </p>
                  <p className="mt-1 text-14 font-medium text-gray-600">
                    {selectedDetails.type} transaction
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailRow label="Status" value={selectedDetails.status} />
                  <DetailRow label="Category" value={selectedDetails.category} />
                  <DetailRow label="Channel" value={selectedDetails.channel} />
                  <DetailRow label="Date" value={selectedDetails.date} />
                  <DetailRow label="Currency" value={selectedDetails.currency} />
                  <DetailRow label="Account ID" value={selectedDetails.accountId} />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-gray-600">
                    <Hash size={16} />
                    <p className="text-12 font-semibold uppercase">Reference</p>
                  </div>
                  <p className="break-all text-13 font-medium text-gray-700">
                    {selectedDetails.reference}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                    <CreditCard size={18} />
                    <p className="mt-2 text-12 font-semibold">Account linked</p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
                    <Tag size={18} />
                    <p className="mt-2 text-12 font-semibold">Categorized</p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
                    <CalendarDays size={18} />
                    <p className="mt-2 text-12 font-semibold">Dated record</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TransactionsTable;
