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
    (loggedIn as any).user_metadata?.defaultReceivingAccountId ||
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
        >
          <section className="space-y-4">
            <div>
              <h2 className="text-20 font-bold text-gray-900">Security</h2>
              <p className="mt-1 text-13 text-gray-600">
                Manage password changes and two-factor verification.
              </p>
            </div>
            <div className="grid gap-4">
              <ChangePasswordForm />
              <TwoFactorAuth />
            </div>
          </section>
        </SettingsDashboard>
      </section>
    </section>
  );
};

export default SettingsPage;
