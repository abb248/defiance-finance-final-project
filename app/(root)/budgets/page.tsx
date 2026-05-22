import BudgetManagement from "@/components/BudgetManagement";
import HeaderBox from "@/components/HeaderBox";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const Budgets = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) redirect("/sign-in");

  const accounts = await getAccounts({ email: loggedIn.email });
  const accountsData = accounts?.data || [];

  const accountDetailsList = await Promise.all(
    accountsData.map((account: Account) =>
      getAccount({
        supabaseItemId: account.supabaseItemId,
        connectionId: account.connectionId,
        account,
      })
    )
  );

  const transactions = accountDetailsList.flatMap(
    (accountDetails) => accountDetails?.transactions || []
  );

  return (
    <section className="flex min-h-screen w-full flex-col gap-8 overflow-y-auto bg-gray-25 p-8 xl:py-12">
      <HeaderBox
        title="Budget Management"
        subtext="Set monthly category limits and track how close each budget is to its limit."
      />

      <BudgetManagement
        accounts={accountsData}
        transactions={transactions}
        totalCurrentBalance={Number(accounts?.totalCurrentBalance) || 0}
        userScope={loggedIn.email}
      />
    </section>
  );
};

export default Budgets;
