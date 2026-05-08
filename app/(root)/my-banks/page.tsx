import React from 'react'
import BankCard from '@/components/ui/BankCard'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) redirect('/sign-in');

  const accounts = await getAccounts({ email: loggedIn.email });
  const accountsData = accounts?.data || [];

  return (
    <section className="my-banks">
      <header className="flex w-full flex-col gap-2">
        <h1 className="text-24 font-semibold text-gray-900">My Banks</h1>
        <p className="text-14 text-gray-600">
          Connected accounts: {accountsData.length}
        </p>
      </header>

      {accountsData.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-14 text-gray-600">
          Henüz bağlı banka hesabın yok. Sağ üstten <b>Add Bank</b> ile bağlayabilirsin.
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {accountsData.map((acc: any) => (
            <BankCard
              key={acc.id}
              account={acc}
              userName={
                [loggedIn.firstName, loggedIn.lastName].filter(Boolean).join(' ') ||
                loggedIn.email
              }
              showBalance
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default MyBanks