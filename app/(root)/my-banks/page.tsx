import React from 'react'
import BankCard from '@/components/ui/BankCard'
import HeaderBox from '@/components/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) redirect('/sign-in');

  const accounts = await getAccounts({ email: loggedIn.email });
  const accountsData = accounts?.data || [];

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activities."
        />

        <div className="space-y-4">
          <h2 className="header-2">Your cards</h2>

          {accountsData.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-14 text-gray-600">
              Henüz bağlı banka hesabın yok. Sisteme bir hesap bağladığında kartların burada görünecek.
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(
                accountsData.reduce((acc: any, a: any) => {
                  const bankGroup = a.bankName || a.name || 'Diğer Hesaplar';
                  if (!acc[bankGroup]) acc[bankGroup] = [];
                  acc[bankGroup].push(a);
                  return acc;
                }, {})
              ).map(([bankGroup, accounts]: [string, any]) => (
                <div key={bankGroup} className="flex flex-col gap-4">
                  <h3 className="text-18 font-bold text-gray-700 border-b border-gray-200 pb-2">{bankGroup}</h3>
                  <div className="flex flex-wrap gap-6">
                    {accounts.map((a: any) => (
                      <BankCard
                        key={a.id}
                        account={{
                          ...a,
                          shareableId: a.id || a.supabaseItemId
                        }}
                        userName={
                          [loggedIn.firstName, loggedIn.lastName].filter(Boolean).join(' ') ||
                          "Dila"
                        }
                        showBalance={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MyBanks