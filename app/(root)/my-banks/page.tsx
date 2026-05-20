import { FormattedAmount } from '@/components/FormattedAmount';
import BankCard from "@/components/ui/BankCard";
import HeaderBox from "@/components/HeaderBox";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { Building2, CreditCard, Wallet } from "lucide-react";
import { redirect } from "next/navigation";

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) redirect("/sign-in");

  const accounts = await getAccounts({ email: loggedIn.email });
  const accountsData = accounts?.data || [];
  const userName =
    [loggedIn.firstName, loggedIn.lastName].filter(Boolean).join(" ") || "User";

  const groupedAccounts = accountsData.reduce<Record<string, Account[]>>(
    (acc, account) => {
      const bankGroup = account.bankName || account.name || "Other accounts";
      if (!acc[bankGroup]) acc[bankGroup] = [];
      acc[bankGroup].push(account);
      return acc;
    },
    {}
  );

  const bankGroups = Object.entries(groupedAccounts);

  return (
    <section className="my-banks">
      <div className="my-banks-intro">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Manage your connected accounts and cards in one place."
        />

        {accountsData.length > 0 ? (
          <div className="my-banks-stats">
            <div className="my-banks-stat">
              <div className="my-banks-stat-icon my-banks-stat-icon--blue">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="my-banks-stat-label">Total accounts</p>
                <p className="my-banks-stat-value">{accountsData.length}</p>
              </div>
            </div>

            <div className="my-banks-stat">
              <div className="my-banks-stat-icon my-banks-stat-icon--green">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="my-banks-stat-label">Combined balance</p>
                <p className="my-banks-stat-value">
                  <FormattedAmount amount={accounts?.totalCurrentBalance || 0} />
                </p>
              </div>
            </div>

            <div className="my-banks-stat">
              <div className="my-banks-stat-icon my-banks-stat-icon--purple">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="my-banks-stat-label">Connected banks</p>
                <p className="my-banks-stat-value">{accounts?.totalBanks || 0}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {accountsData.length === 0 ? (
        <div className="my-banks-empty">
          <CreditCard className="size-10 text-gray-400" strokeWidth={1.5} />
          <h3 className="text-18 font-semibold text-gray-900">No accounts yet</h3>
          <p className="max-w-md text-14 text-gray-600">
            Connect a bank to see your cards here. Each account will appear with
            its balance and transaction history.
          </p>
        </div>
      ) : (
        <div className="my-banks-groups">
          {bankGroups.map(([bankGroup, bankAccounts]) => (
            <section key={bankGroup} className="my-banks-group">
              <header className="my-banks-group-header">
                <div className="my-banks-group-icon">
                  <Building2 className="size-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-18 font-bold text-gray-900">{bankGroup}</h2>
                  <p className="text-14 text-gray-600">
                    {bankAccounts.length}{" "}
                    {bankAccounts.length === 1 ? "account" : "accounts"}
                  </p>
                </div>
              </header>

              <div className="my-banks-grid">
                {bankAccounts.map((account) => (
                  <BankCard
                    key={account.id}
                    account={{
                      ...account,
                      shareableId: account.shareableId || account.supabaseItemId,
                    }}
                    userName={userName}
                    showBalance
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyBanks;
