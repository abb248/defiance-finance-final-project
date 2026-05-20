import GoalsCenter from "@/components/GoalsCenter";
import HeaderBox from "@/components/HeaderBox";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const Goals = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) redirect("/sign-in");

  const accounts = await getAccounts({ email: loggedIn.email });
  const accountsData = accounts?.data || [];

  return (
    <section className="flex min-h-screen w-full flex-col gap-8 overflow-y-auto bg-gray-25 p-8 xl:py-12">
      <HeaderBox
        title="Goals & Savings"
        subtext="Set savings goals, track progress, and see how much to save each week."
      />

      <GoalsCenter
        accounts={accountsData}
        totalCurrentBalance={Number(accounts?.totalCurrentBalance) || 0}
      />
    </section>
  );
};

export default Goals;
