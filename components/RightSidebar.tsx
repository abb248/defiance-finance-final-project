"use client"; // Buton tıklaması (onClick) için client component olması gerekiyor

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import BankCard from '@/components/ui/BankCard'
import { createConnectSession, createSaltEdgeCustomer } from '@/lib/actions/saltedge.actions' // Salt Edge oturum oluşturma fonksiyonunu import ettik

type RightSidebarProps = {
  user: {
    id?: string // Supabase user tablosunda id alanı var, ama biz kullanmayacağız. Yine de ekledim.
    firstName?: string
    lastName?: string
    email: string
  }
  transactions?: any[]
  banks?: any[]
}

const RightSidebar = ({ user, banks = [] }: RightSidebarProps) => {
  const router = useRouter();

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
      
      if (!customer || !customer.id) {
        alert("HATA: Salt Edge müşteri oluşturamadı! VS Code terminaline (siyah ekrana) bak, API hatası dönmüş olabilir.");
        return;
      }

      // 2. Link Üret
      const connectUrl = await createConnectSession(customer.id);
      
      if (!connectUrl) {
        alert("HATA: Müşteri oluştu ama Salt Edge banka linki vermedi! VS Code terminalini kontrol et.");
        return;
      }

      // 3. Başarılıysa Yönlendir
      alert("Başarılı! Salt Edge ekranına yönlendiriliyorsun...");
      router.push(connectUrl);

    } catch (error) {
      console.error("Banka bağlama ekranı açılamadı", error);
      alert("Beklenmeyen bir hata oluştu. Tarayıcıda F12'ye basıp Console sekmesine bak.");
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
                key={banks[0].id} // Supabasede bankaların id'si var, o yüzden id ile key verdik
                account={banks[0]}
                userName={fullName}
                showBalance={false}
              />
            </div>

            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1].id} // Supabasede bankaların id'si var, o yüzden id ile key verdik
                  account={banks[1]}
                  userName={fullName}
                  showBalance={false}
                />
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  )
}

export default RightSidebar