import DefaultReceivingAccountSelect from "@/components/DefaultReceivingAccountSelect";
import HeaderBox from "@/components/HeaderBox";
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
        subtext="Manage your preferences and default receiving account."
      />

      <section className="size-full pt-5">
        {accountsData.length > 0 ? (
          <DefaultReceivingAccountSelect
            accounts={accountsData}
            currentDefaultId={currentDefaultId}
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-14 text-gray-600">
            Connect a bank account first to choose a default receiving account.
          </div>
        )}
      </section>
    </section>
  );
};

export default SettingsPage;

