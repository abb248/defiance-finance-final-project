import ChangePasswordForm from "@/components/ChangePasswordForm";
import HeaderBox from "@/components/HeaderBox";
import SettingsDashboard from "@/components/SettingsDashboard";
import TwoFactorAuth from "@/components/TwoFactorAuth";
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
        subtext="Manage display preferences, assistant context, and privacy controls."
      />

      <section className="w-full pt-5">
        <SettingsDashboard
          user={loggedIn}
          accounts={accountsData}
          currentDefaultId={currentDefaultId}
        />
      </section>

      <section className="grid w-full gap-6 pb-5 xl:grid-cols-2">
        <ChangePasswordForm />
        <TwoFactorAuth />
      </section>
    </section>
  );
};

export default SettingsPage;
