'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utilsz'
import { logoutAccount } from '@/lib/actions/user.actions'
import { LogOut } from 'lucide-react'
import CurrencySelector from './CurrencySelector'

type SidebarProps = {
  user: {
    firstName?: string
    lastName?: string
    email: string
  }
}

const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAccount()
    router.push('/sign-in')
  }

  const firstInitial = (user?.firstName?.trim()?.[0] || user?.email?.trim()?.[0] || 'U').toUpperCase()
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'User'

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 cursor-pointer flex items-center gap-2">
          <Image
            src="/brand/defiance-logo.jpg"
            width={40}
            height={40}
            alt="Defiance Finance logo"
            className="size-8 rounded-full object-contain max-xl:size-14"
          />
          <h1 className="sidebar-logo">De-Fi</h1>
        </Link>

        {sidebarLinks.map((item) => {
          const isActive =
            pathname === item.route || pathname.startsWith(`${item.route}/`)

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn('sidebar-link', {
                'bg-bank-gradient': isActive,
              })}
            >
              <div className="relative size-6">
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({
                    'brightness-[3] invert-0': isActive,
                  })}
                />
              </div>
              <p
                className={cn('sidebar-label', {
                  '!text-white': isActive,
                })}
              >
                {item.label}
              </p>
            </Link>
          )
        })}

        <div className="sidebar-currency-row max-xl:hidden">
          <p className="text-11 font-semibold uppercase text-gray-500">
            App currency
          </p>
          <CurrencySelector />
        </div>
      </nav>

      <footer className="footer">
        <div className="flex w-full items-center justify-between">
          <Link
            href="/settings"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg transition-colors hover:bg-gray-50"
            aria-label="Open profile settings"
          >
            <div className="footer_name flex-shrink-0">
              <p className="text-xl font-bold text-white">{firstInitial}</p>
            </div>

            <div className="footer_email flex-1 min-w-0">
              <h1 className="text-14 truncate font-semibold text-gray-700">
                {fullName}
              </h1>
              <p className="text-14 truncate font-normal text-gray-600">
                {user.email}
              </p>
            </div>
          </Link>

          <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-md transition-colors" onClick={handleLogout}>
            <LogOut size={20} className="text-gray-600" />
          </div>
        </div>
      </footer>
    </section>
  )
}

export default Sidebar
