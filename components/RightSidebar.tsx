"use client"; // Buton tıklaması (onClick) için client component olması gerekiyor

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Category from '@/components/Category'
import BankCard from '@/components/ui/BankCard'
import { countTransactionCategories } from '@/lib/utilsz'
import { createConnectSession, createSaltEdgeCustomer } from '@/lib/actions/saltedge.actions' // Salt Edge oturum oluşturma fonksiyonunu import ettik



const RightSidebar = ({ user, banks = [], transactions = [] }: RightSidebarProps) => {
  const router = useRouter();
  const categories = countTransactionCategories(transactions);

  const firstInitial = (user?.firstName?.trim()?.[0] || user?.email?.trim()?.[0] || 'U').toUpperCase()
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'User'

  const handleAddBank = async () => {
    try {
      console.log("1. İstek atılıyor: ", user.email);

      // 1. Müşteri Oluştur
      const customer = await createSaltEdgeCustomer(user.email);
      console.log("2. Salt Edge customer:", customer);

      const customerId = customer?.customer_id || customer?.id;
      if (!customer || !customerId) {
        alert("HATA: Salt Edge müşteri oluşturamadı! VS Code terminaline (siyah ekrana) bak, API hatası dönmüş olabilir.");
        return;
      }

      // 2. Link Üret
      const connectUrl = await createConnectSession(String(customerId), window.location.origin);
      console.log("3. Salt Edge connect_url:", connectUrl);

      if (!connectUrl) {
        alert("HATA: Müşteri oluştu ama Salt Edge banka linki vermedi! VS Code terminalini kontrol et.");
        return;
      }

      // 3. Başarılıysa Yönlendir
      // Salt Edge connect_url harici bir domain olabiliyor; Next router.push bazen engelleyebiliyor.
      window.location.assign(connectUrl);

    } catch (error) {
      console.error("Banka bağlama ekranı açılamadı", error);
      const message =
        error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');
      alert(`Beklenmeyen bir hata oluştu: ${message}\n\nTarayıcıda F12 → Console ve terminali kontrol et.`);
    }
  }
  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />

        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-bold text-blue-500">
              {firstInitial}
            </span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">
              {fullName}
            </h1>
            <p className="profile-email">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <section className="banks">
        <div className="flex w-full justify-between">
          <h2 className="header-2">My Banks</h2>

          {/* Link yerine Button kullandık ve onClick ekledik */}
          <button
            type="button"
            onClick={handleAddBank}
            className="flex gap-2 items-center cursor-pointer bg-transparent border-none p-0"
          >
            <Image
              src="/icons/plus.svg"
              width={20}
              height={20}
              alt="plus"
            />
            <h2 className="text-14 font-semibold text-gray-600">
              Add Bank
            </h2>
          </button>
        </div>

        {banks?.length > 0 && (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
            <div className="relative z-10">
              <BankCard
                key={banks[0].id}
                account={banks[0]}
                userName={fullName}
                showBalance={false}
                variant="sidebar"
              />
            </div>

            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1].id}
                  account={banks[1]}
                  userName={fullName}
                  showBalance={false}
                  variant="sidebar"
                />
              </div>
            )}
          </div>
        )}

        <div className="spending-categories">
          <h2 className="header-2">Top Categories</h2>

          {categories.length > 0 ? (
            <div className="space-y-5">
              {categories.map((category, index) => (
                <Category
                  key={category.name}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 text-center text-14 text-gray-600">
              No spending categories yet.
            </div>
          )}
        </div>
      </section>
    </aside>
  )
}

export default RightSidebar
