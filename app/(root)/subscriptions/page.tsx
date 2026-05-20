import HeaderBox from "@/components/HeaderBox";
import SubscriptionsCenter from "@/components/SubscriptionsCenter";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const Subscriptions = async () => {
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
        title="Subscriptions"
        subtext="Track recurring bills, fixed monthly costs, and upcoming payment reminders."
      />

      <SubscriptionsCenter accounts={accountsData} transactions={transactions} />
    </section>
  );
};

export default Subscriptions;
