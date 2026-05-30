import { FormattedAmount } from '@/components/FormattedAmount';
import HeaderBox from "@/components/HeaderBox";
import TransactionAccountSelect from "@/components/TransactionAccountSelect";
import TransactionFilters from "@/components/TransactionFilters";
import Pagination from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { convertAmount } from "@/lib/utilsz";
import { redirect } from "next/navigation";

const ROWS_PER_PAGE = 10;
const ALL_ACCOUNTS_ID = "all";

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getSignedAmount = (transaction: Transaction) => {
  if (typeof transaction.signedAmount === "number") return transaction.signedAmount;
  const amount = Math.abs(Number(transaction.amount) || 0);
  return transaction.type === "debit" ? -amount : amount;
};

const getSignedAmountInUsd = (transaction: Transaction) =>
  convertAmount(
    getSignedAmount(transaction),
    transaction.currencyCode || "USD",
    "USD"
  );

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
  const status = normalizeValue(query.status);
  const channel = normalizeValue(query.channel);
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
        transaction.accountName,
        transaction.paymentChannel,
        transaction.status,
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (search && !searchableText.includes(search)) return false;
    if (category && normalizeValue(transaction.category) !== category) return false;
    if (status && normalizeValue(transaction.status) !== status) return false;
    if (channel && normalizeValue(transaction.paymentChannel) !== channel) return false;
    if (type && transactionType !== type) return false;
    if (from && (!transactionDate || transactionDate < from)) return false;
    if (to && (!transactionDate || transactionDate > to)) return false;
    if (min !== null && !Number.isNaN(min) && amount < min) return false;
    if (max !== null && !Number.isNaN(max) && amount > max) return false;

    return true;
  });
};

const sortTransactions = (
  transactions: Transaction[],
  sort = "newest"
) =>
  [...transactions].sort((a, b) => {
    if (sort === "oldest") {
      return (getTransactionDateTime(a) || 0) - (getTransactionDateTime(b) || 0);
    }

    if (sort === "amount-desc") {
      return Math.abs(getSignedAmount(b)) - Math.abs(getSignedAmount(a));
    }

    if (sort === "amount-asc") {
      return Math.abs(getSignedAmount(a)) - Math.abs(getSignedAmount(b));
    }

    return (getTransactionDateTime(b) || 0) - (getTransactionDateTime(a) || 0);
  });

const getCategoryOptions = (transactions: Transaction[]) =>
  Array.from(
    new Set(
      transactions
        .map((transaction) => transaction.category?.replace(/_/g, " ").trim())
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => a.localeCompare(b));

const getTextOptions = (transactions: Transaction[], key: keyof Transaction) =>
  Array.from(
    new Set(
      transactions
        .map((transaction) => String(transaction[key] || "").replace(/_/g, " ").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

const addAccountContext = (transactions: Transaction[], account: Account) =>
  transactions.map((transaction) => ({
    ...transaction,
    accountId: transaction.accountId || account.supabaseItemId,
    accountName: account.name || account.bankName || "Bank account",
  }));

const getTransactionTotals = (transactions: Transaction[]) =>
  transactions.reduce(
    (totals, transaction) => {
      const signedAmount = getSignedAmount(transaction);
      const signedAmountInUsd = getSignedAmountInUsd(transaction);
      if (signedAmount < 0) {
        totals.expense += Math.abs(signedAmountInUsd);
      } else {
        totals.income += signedAmountInUsd;
      }
      totals.net += signedAmountInUsd;
      return totals;
    },
    { income: 0, expense: 0, net: 0 }
  );

const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
  const {
    id,
    page,
    search,
    category,
    status,
    channel,
    type,
    from,
    to,
    min,
    max,
    sort,
  } = searchParams;
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect("/sign-in");

  const currentPage = Math.max(Number(getSingleParam(page)) || 1, 1);
  const filterQuery: TransactionFilterQuery = {
    id: getSingleParam(id),
    search: getSingleParam(search),
    category: getSingleParam(category),
    status: getSingleParam(status),
    channel: getSingleParam(channel),
    type: getSingleParam(type),
    from: getSingleParam(from),
    to: getSingleParam(to),
    min: getSingleParam(min),
    max: getSingleParam(max),
    sort: getSingleParam(sort),
  };

  const accounts = await getAccounts({
    email: loggedIn.email,
  });

  const accountsData = accounts?.data || [];
  const requestedId = filterQuery.id;
  const isAllAccounts = requestedId === ALL_ACCOUNTS_ID;
  const selectedAccount = isAllAccounts
    ? null
    : accountsData.find((account: Account) => account.supabaseItemId === requestedId) ||
      accountsData[0];

  const accountDetailsList = isAllAccounts
    ? await Promise.all(
        accountsData.map((account: Account) =>
          getAccount({
            supabaseItemId: account.supabaseItemId,
            connectionId: account.connectionId,
            account,
          })
        )
      )
    : selectedAccount
    ? [
        await getAccount({
          supabaseItemId: selectedAccount.supabaseItemId,
          connectionId: selectedAccount.connectionId,
          account: selectedAccount,
        }),
      ]
    : [];

  const transactions = isAllAccounts
    ? accountsData.flatMap((account: Account, index: number) =>
        addAccountContext(accountDetailsList[index]?.transactions || [], account)
      )
    : selectedAccount
    ? addAccountContext(accountDetailsList[0]?.transactions || [], selectedAccount)
    : [];
  const filteredTransactions = sortTransactions(
    filterTransactions(transactions, filterQuery),
    filterQuery.sort
  );
  const categoryOptions = getCategoryOptions(transactions);
  const statusOptions = getTextOptions(transactions, "status");
  const channelOptions = getTextOptions(transactions, "paymentChannel");
  const totals = getTransactionTotals(filteredTransactions);
  const totalPages = Math.ceil(filteredTransactions.length / ROWS_PER_PAGE);
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIndex = (safePage - 1) * ROWS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );
  const paginationQuery: TransactionFilterQuery = {
    ...filterQuery,
    id: isAllAccounts ? ALL_ACCOUNTS_ID : selectedAccount?.supabaseItemId,
  };
  const activeAccountId = isAllAccounts
    ? ALL_ACCOUNTS_ID
    : selectedAccount?.supabaseItemId || accountsData[0]?.supabaseItemId;

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
            selectedId={activeAccountId}
            allowAllAccounts
            totalCurrentBalance={Number(accounts?.totalCurrentBalance) || 0}
          />
        ) : null}
      </div>

      {selectedAccount || isAllAccounts ? (
        <div className="space-y-6">
          <div className="transactions-account">
            <div className="flex flex-col gap-2">
              <h2 className="text-18 font-bold text-white">
                {isAllAccounts ? "All accounts" : selectedAccount?.name || "Bank account"}
              </h2>
              <p className="text-14 text-blue-25">
                {isAllAccounts
                  ? `${accountsData.length} connected accounts`
                  : selectedAccount?.bankName || selectedAccount?.subtype || "Account"}
              </p>
              {!isAllAccounts ? (
                <p className="text-14 text-blue-25">
                  Shareable ID:{" "}
                  {selectedAccount?.shareableId || selectedAccount?.supabaseItemId}
                </p>
              ) : null}
            </div>

            <div className="transactions-account-balance">
              <p className="text-14">
                {isAllAccounts ? "Total Balance" : "Current Balance"}
              </p>
              <p className="text-24 font-bold">
                <FormattedAmount amount={
                  isAllAccounts
                    ? Number(accounts?.totalCurrentBalance) || 0
                    : selectedAccount?.currentBalance || 0
                } sourceCurrency={isAllAccounts ? "USD" : selectedAccount?.currencyCode} />
              </p>
            </div>
          </div>

          <TransactionFilters
            categories={categoryOptions}
            statuses={statusOptions}
            channels={channelOptions}
            query={filterQuery}
            selectedAccountId={activeAccountId}
            totalCount={transactions.length}
            filteredCount={filteredTransactions.length}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Filtered income
              </p>
              <p className="mt-2 text-20 font-bold text-success-700">
                <FormattedAmount amount={totals.income} />
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Filtered spending
              </p>
              <p className="mt-2 text-20 font-bold text-[#F04438]">
                <FormattedAmount amount={totals.expense} />
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-12 font-semibold uppercase text-gray-500">
                Net movement
              </p>
              <p className="mt-2 text-20 font-bold text-gray-900">
                <FormattedAmount amount={totals.net} />
              </p>
            </div>
          </div>

          <TransactionsTable
            transactions={paginatedTransactions}
            showAccount={isAllAccounts}
            emptyMessage="No transactions match these filters yet."
          />

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
