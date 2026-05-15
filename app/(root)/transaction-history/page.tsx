import HeaderBox from "@/components/HeaderBox";
import Pagination from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { formatAmount } from "@/lib/utilsz";
import { redirect } from "next/navigation";

const ROWS_PER_PAGE = 10;

const TransactionHistory = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect("/sign-in");

  const currentPage = Math.max(Number(page as string) || 1, 1);

  const accounts = await getAccounts({
    email: loggedIn.email,
  });

  const accountsData = accounts?.data || [];
  const requestedId = typeof id === "string" ? id : undefined;
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
  const totalPages = Math.ceil(transactions.length / ROWS_PER_PAGE);
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIndex = (safePage - 1) * ROWS_PER_PAGE;
  const paginatedTransactions = transactions.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  return (
    <section className="transactions">
      <div className="transactions-header">
        <HeaderBox
          title="Transaction History"
          subtext="See your bank details and transactions."
        />
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

          <TransactionsTable transactions={paginatedTransactions} />

          <Pagination
            page={safePage}
            totalPages={totalPages}
            query={{ id: selectedAccount.supabaseItemId }}
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
