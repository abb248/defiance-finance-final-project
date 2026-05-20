import ChangePasswordForm from "@/components/ChangePasswordForm";
import HeaderBox from "@/components/HeaderBox";
import SettingsDashboard from "@/components/SettingsDashboard";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) redirect("/sign-in");

  const accounts = await getAccounts({ email: loggedIn.email });
  const accountsData = accounts?.data || [];

  const currentDefaultId =
    (loggedIn as any).default_receiving_account_id ||
    (loggedIn as any).defaultReceivingAccountId ||
    (loggedIn as any).default_account_id ||
    (loggedIn as any).defaultAccountId ||
    undefined;

  return (
    <section className="payment-transfer">
      <HeaderBox
        title="Settings"
        subtext="Manage your profile, transfer defaults, and app preferences."
      />

      <section className="w-full pt-5">
        <SettingsDashboard
          user={loggedIn}
          accounts={accountsData}
          totalCurrentBalance={Number(accounts?.totalCurrentBalance) || 0}
          currentDefaultId={currentDefaultId}
        />
      </section>

      <section className="w-full pb-5">
        <ChangePasswordForm />
      </section>
    </section>
  );
};

export default SettingsPage;
