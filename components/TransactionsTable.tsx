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

const TransactionsTable = ({ transactions = [] }: TransactionTableProps) => {
  if (!transactions.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-14 text-gray-600">
        No transactions found for this account yet.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse">
        <thead className="bg-[#F9FAFB]">
          <tr className="text-left text-12 font-semibold uppercase text-gray-600">
            <th className="px-4 py-3">Transaction</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 max-md:hidden">Channel</th>
            <th className="px-4 py-3 max-md:hidden">Category</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => {
            const isDebit =
              transaction.type === "debit" || Number(transaction.signedAmount) < 0;
            const amount = formatTransactionAmount(transaction);

            return (
              <tr
                key={transaction.id}
                className={cn("border-b border-gray-200 last:border-b-0", {
                  "bg-[#FFFBFA]": isDebit,
                  "bg-[#F6FEF9]": !isDebit,
                })}
              >
                <td className="max-w-[250px] px-4 py-4 pr-10">
                  <p className="truncate text-14 font-semibold text-gray-700">
                    {removeSpecialCharacters(transaction.name)}
                  </p>
                </td>

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
  );
};

export default TransactionsTable;
