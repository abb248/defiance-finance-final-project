import { formatAmount } from '../../lib/utilsz'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Copy from '@/components/Copy'




const gradients = [
  'bg-bank-gradient',
  'bg-bank-green-gradient',
  'bg-bank-purple-gradient',
  'bg-bank-orange-gradient',
  'bg-bank-pink-gradient',
  'bg-bank-emerald-gradient',
];

const BankCard = ({
  account,
  userName,
  showBalance = true,
  gradientClass,
}: CreditCardProps) => {
  const bankIdentifier = account.bankName || account.name || 'default';
  const hash = bankIdentifier.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const finalGradient = gradientClass || gradients[hash % gradients.length];

  return (
    <div className="flex flex-col">
      {/* 1. DEĞİŞİKLİK: Link dinamik hale getirildi */}
      <Link href={`/transaction-history/?id=${account.supabaseItemId}`} className={`bank-card min-w-[325px] ${finalGradient}`}>
        <div className={`bank-card_content ${finalGradient}`}>
          <div>
            <h1 className="text-16 font-semibold text-white">
              {account.name || userName}
            </h1>

            <p className="font-ibm-plex-serif font-black text-white">
              {showBalance ? formatAmount(account.currentBalance) : '****'}
            </p>
          </div>

          <article className="flex flex-col gap-2">
            <div className="flex justify-between">
              <h1 className="text-12 font-semibold text-white">
                {userName}
              </h1>

              <h2 className="text-12 font-semibold text-white">
                ✪✪ / ✪✪
              </h2>
            </div>

            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ✪✪✪✪ ✪✪✪✪ ✪✪✪✪ <span className="text-16">1234</span>
            </p>
          </article>
        </div>

        <div className={`bank-card_icon ${finalGradient}`}>
          <Image
            src="/icons/Paypass.svg"
            width={20}
            height={24}
            alt="pay"
          />

          <Image
            src="/icons/mastercard.svg"
            width={45}
            height={32}
            alt="mastercard"
            className="ml-5"
          />
        </div>

        <Image
          src="/icons/lines.png"
          width={316}
          height={190}
          alt="lines"
          className="absolute left-0 top-0"
        />
      </Link>

      {/* 2. DEĞİŞİKLİK: Copy butonu eklendi */}
      {showBalance && <Copy title={account?.shareableId} />}
    </div>
  )
}

export default BankCard