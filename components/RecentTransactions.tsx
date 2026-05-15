import Link from "next/link";
import React from "react";

import BankInfo from "./BankInfo";
import BankTabItem from "./BankTabItem";
import TransactionsTable from "./TransactionsTable";

const VISIBLE_ACCOUNT_TABS = 3;

const RecentTransactions = ({
  accounts = [],
  transactions = [],
  supabaseItemId,
}: RecentTransactionsProps) => {
  const activeAccount =
    accounts.find((account) => account.supabaseItemId === supabaseItemId) ||
    accounts[0];
  const activeId = activeAccount?.supabaseItemId || supabaseItemId;
  const visibleAccounts = accounts.slice(0, VISIBLE_ACCOUNT_TABS);
  const accountsToShow =
    activeAccount &&
    !visibleAccounts.some((account) => account.supabaseItemId === activeId)
      ? [...visibleAccounts.slice(0, VISIBLE_ACCOUNT_TABS - 1), activeAccount]
      : visibleAccounts;

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
            {accountsToShow.map((account) => (
              <BankTabItem
                key={account.id}
                account={account}
                supabaseItemId={activeId}
              />
            ))}
          </div>

          {activeAccount ? <BankInfo account={activeAccount} /> : null}

          <TransactionsTable transactions={transactions} />
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
