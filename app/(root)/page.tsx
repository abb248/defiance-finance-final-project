import HeaderBox from '@/components/HeaderBox'
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { sortAccountsByRecentTransactions } from '@/lib/utilsz';
import { redirect } from "next/navigation";
import TwoFactorAuth from '@/components/TwoFactorAuth';

const RECENT_TRANSACTIONS_LIMIT = 5;

const Home = async ({ searchParams: { id } }: SearchParamProps) => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  const accounts = await getAccounts({
    email: loggedIn.email
  });

  if (!accounts) return;

  const accountsData = accounts?.data || [];
  const supabaseItemId = (id as string) || accountsData[0]?.supabaseItemId;

  const accountDetailsList = await Promise.all(
    accountsData.map((account: Account) =>
      getAccount({
        supabaseItemId: account.supabaseItemId,
        connectionId: account.connectionId,
        account,
      })
    )
  );

  const transactionsByAccountId = accountsData.reduce<Record<string, Transaction[]>>(
    (acc, account, index) => {
      acc[account.supabaseItemId] = accountDetailsList[index]?.transactions || [];
      return acc;
    },
    {}
  );

  const accountsByRecentActivity = sortAccountsByRecentTransactions(
    accountsData,
    transactionsByAccountId
  );

  const featuredAccounts = accountsByRecentActivity.slice(0, 3);

  const selectedIndex = accountsData.findIndex(
    (account: Account) => account.supabaseItemId === supabaseItemId
  );
  const selectedAccountDetails =
    selectedIndex >= 0 ? accountDetailsList[selectedIndex] : accountDetailsList[0];

  const recentTransactions = (selectedAccountDetails?.transactions || []).slice(
    0,
    RECENT_TRANSACTIONS_LIMIT
  );

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.firstName || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>

        
        <div className="mt-8 mb-8 w-full">
          <TwoFactorAuth />
        </div>
        

        <RecentTransactions
          accounts={accountsData}
          featuredAccounts={featuredAccounts}
          transactions={recentTransactions}
          supabaseItemId={supabaseItemId}
        />
      </div>

      <RightSidebar
        user={loggedIn}
        transactions={selectedAccountDetails?.transactions || []}
        banks={accountsData.slice(0, 2)}
      />
    </section>
  )
}

export default Home;