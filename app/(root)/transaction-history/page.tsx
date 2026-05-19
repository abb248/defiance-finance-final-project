import HeaderBox from "@/components/HeaderBox";
import TransactionAccountSelect from "@/components/TransactionAccountSelect";
import TransactionFilters from "@/components/TransactionFilters";
import Pagination from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { formatAmount } from "@/lib/utilsz";
import { redirect } from "next/navigation";

const ROWS_PER_PAGE = 10;

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getSignedAmount = (transaction: Transaction) => {
  if (typeof transaction.signedAmount === "number") return transaction.signedAmount;
  const amount = Math.abs(Number(transaction.amount) || 0);
  return transaction.type === "debit" ? -amount : amount;
};

const normalizeValue = (value?: string) =>
  (value || "").toLowerCase().replace(/_/g, " ").trim();

const getTransactionDateTime = (transaction: Transaction) => {
  const date = new Date(transaction.date || 0);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const getDateBoundary = (value?: string, endOfDay = false) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);

  return date.getTime();
};

const filterTransactions = (
  transactions: Transaction[],
  query: TransactionFilterQuery
) => {
  const search = normalizeValue(query.search);
  const category = normalizeValue(query.category);
  const type = normalizeValue(query.type);
  const from = getDateBoundary(query.from);
  const to = getDateBoundary(query.to, true);
  const min = query.min ? Number(query.min) : null;
  const max = query.max ? Number(query.max) : null;

  return transactions.filter((transaction) => {
    const signedAmount = getSignedAmount(transaction);
    const amount = Math.abs(signedAmount);
    const transactionDate = getTransactionDateTime(transaction);
    const transactionType = signedAmount < 0 ? "debit" : "credit";
    const searchableText = normalizeValue(
      [
        transaction.name,
        transaction.category,
        transaction.paymentChannel,
        transaction.status,
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (search && !searchableText.includes(search)) return false;
    if (category && normalizeValue(transaction.category) !== category) return false;
    if (type && transactionType !== type) return false;
    if (from && (!transactionDate || transactionDate < from)) return false;
    if (to && (!transactionDate || transactionDate > to)) return false;
    if (min !== null && !Number.isNaN(min) && amount < min) return false;
    if (max !== null && !Number.isNaN(max) && amount > max) return false;

    return true;
  });
};

const getCategoryOptions = (transactions: Transaction[]) =>
  Array.from(
    new Set(
      transactions
        .map((transaction) => transaction.category?.replace(/_/g, " ").trim())
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => a.localeCompare(b));

const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
  const { id, page, search, category, type, from, to, min, max } = searchParams;
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect("/sign-in");

  const currentPage = Math.max(Number(getSingleParam(page)) || 1, 1);
  const filterQuery: TransactionFilterQuery = {
    id: getSingleParam(id),
    search: getSingleParam(search),
    category: getSingleParam(category),
    type: getSingleParam(type),
    from: getSingleParam(from),
    to: getSingleParam(to),
    min: getSingleParam(min),
    max: getSingleParam(max),
  };

  const accounts = await getAccounts({
    email: loggedIn.email,
  });

  const accountsData = accounts?.data || [];
  const requestedId = filterQuery.id;
  const selectedAccount =
    accountsData.find((account: Account) => account.supabaseItemId === requestedId) ||
    accountsData[0];

  const account = selectedAccount
    ? await getAccount({
        supabaseItemId: selectedAccount.supabaseItemId,
        connectionId: selectedAccount.connectionId,
        account: selectedAccount,
      })
    : null;
  const transactions = account?.transactions || [];
  const filteredTransactions = filterTransactions(transactions, filterQuery);
  const categoryOptions = getCategoryOptions(transactions);
  const totalPages = Math.ceil(filteredTransactions.length / ROWS_PER_PAGE);
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIndex = (safePage - 1) * ROWS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );
  const paginationQuery: TransactionFilterQuery = {
    ...filterQuery,
    id: selectedAccount?.supabaseItemId,
  };

  return (
    <section className="transactions">
      <div className="transactions-header">
        <HeaderBox
          title="Transaction History"
          subtext="See your bank details and transactions."
        />

        {accountsData.length > 1 ? (
          <TransactionAccountSelect
            accounts={accountsData}
            selectedId={selectedAccount?.supabaseItemId || accountsData[0].supabaseItemId}
          />
        ) : null}
      </div>

      {selectedAccount ? (
        <div className="space-y-6">
          <div className="transactions-account">
            <div className="flex flex-col gap-2">
              <h2 className="text-18 font-bold text-white">
                {selectedAccount.name || "Bank account"}
              </h2>
              <p className="text-14 text-blue-25">
                {selectedAccount.bankName || selectedAccount.subtype || "Account"}
              </p>
              <p className="text-14 text-blue-25">
                Shareable ID: {selectedAccount.shareableId || selectedAccount.supabaseItemId}
              </p>
            </div>

            <div className="transactions-account-balance">
              <p className="text-14">Current Balance</p>
              <p className="text-24 font-bold">
                {formatAmount(selectedAccount.currentBalance || 0)}
              </p>
            </div>
          </div>

          <TransactionFilters
            categories={categoryOptions}
            query={filterQuery}
            selectedAccountId={selectedAccount.supabaseItemId}
            totalCount={transactions.length}
            filteredCount={filteredTransactions.length}
          />

          <TransactionsTable transactions={paginatedTransactions} />

          <Pagination
            page={safePage}
            totalPages={totalPages}
            query={paginationQuery}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-14 text-gray-600">
          Connect a bank account to see your transaction history here.
        </div>
      )}
    </section>
  );
};

export default TransactionHistory;
