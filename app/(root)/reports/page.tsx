import HeaderBox from "@/components/HeaderBox";
import ReportsDashboard from "@/components/ReportsDashboard";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { buildFinancialReport } from "@/lib/report-utils";
import { redirect } from "next/navigation";

const Reports = async () => {
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

  const transactionsByAccountId = accountsData.reduce<Record<string, Transaction[]>>(
    (acc, account, index) => {
      acc[account.supabaseItemId] = accountDetailsList[index]?.transactions || [];
      return acc;
    },
    {}
  );

  const report = buildFinancialReport({
    accounts: accountsData,
    transactionsByAccountId,
    totalCurrentBalance: Number(accounts?.totalCurrentBalance) || 0,
  });

  return (
    <section className="flex min-h-screen w-full flex-col gap-8 overflow-y-auto bg-gray-25 p-8 xl:py-12">
      <HeaderBox
        title="Reports"
        subtext="Visualize income, spending, categories, and account activity in one place."
      />

      <ReportsDashboard report={report} userScope={loggedIn.email} />
    </section>
  );
};

export default Reports;
