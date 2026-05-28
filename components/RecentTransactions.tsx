import Link from "next/link";

import BankInfo from "./BankInfo";
import BankTabItem from "./BankTabItem";
import HomeAccountMoreSelect from "./HomeAccountMoreSelect";
import TransactionsTable from "./TransactionsTable";
import { sortTransactionsByNewest } from "@/lib/utilsz";

const FEATURED_ACCOUNTS_COUNT = 3;
const RECENT_TRANSACTIONS_LIMIT = 5;

const RecentTransactions = ({
  accounts = [],
  featuredAccounts = [],
  transactions = [],
  supabaseItemId,
}: RecentTransactionsProps) => {
  const activeAccount =
    accounts.find((account) => account.supabaseItemId === supabaseItemId) ||
    accounts[0];
  const activeId = activeAccount?.supabaseItemId || supabaseItemId;

  const featured =
    featuredAccounts.length > 0
      ? featuredAccounts.slice(0, FEATURED_ACCOUNTS_COUNT)
      : accounts.slice(0, FEATURED_ACCOUNTS_COUNT);

  const featuredIds = new Set(featured.map((account) => account.supabaseItemId));
  const moreAccounts = accounts.filter(
    (account) => !featuredIds.has(account.supabaseItemId)
  );

  const limitedTransactions = sortTransactionsByNewest(transactions).slice(
    0,
    RECENT_TRANSACTIONS_LIMIT
  );

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between gap-4">
        <h2 className="recent-transactions-label">Recent Transactions</h2>

        {activeId ? (
          <Link href={`/transaction-history?id=${activeId}`} className="view-all-btn">
            View all
          </Link>
        ) : null}
      </header>

      {accounts.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="recent-transactions-tablist">
            {featured.map((account) => (
              <BankTabItem
                key={account.id}
                account={account}
                supabaseItemId={activeId}
              />
            ))}

            {moreAccounts.length > 0 ? (
              <HomeAccountMoreSelect
                accounts={moreAccounts}
                selectedId={activeId || ""}
              />
            ) : null}
          </div>

          {activeAccount ? <BankInfo account={activeAccount} /> : null}

          <TransactionsTable transactions={limitedTransactions} />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-14 text-gray-600">
          Connect a bank account to see recent transactions here.
        </div>
      )}
    </section>
  );
};

export default RecentTransactions;
