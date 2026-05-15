'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface BankAccount {
  id: string
  name: string
  currentBalance: number
  bankName?: string | null
  currencyCode?: string | null
  supabaseItemId: string
}

interface BankDropdownProps {
  accounts: BankAccount[]
  onChange?: (id: string | null, account: BankAccount | null) => void
  otherStyles?: string
}

const BankDropdown = ({ accounts = [], onChange, otherStyles }: BankDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<BankAccount | null>(accounts[0] || null)

  const handleSelect = (account: BankAccount) => {
    setSelected(account)
    setIsOpen(false)
    onChange?.(account.id, account)
  }

  return (
    <div className={`relative ${otherStyles || ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-form transition-all hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        id="bank-dropdown-trigger"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
            </svg>
          </div>
          <span className="text-14 font-medium text-gray-900">
            {selected ? selected.name : 'Select a bank'}
          </span>
        </div>
        <svg
          className={`size-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => handleSelect(account)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-25 ${
                selected?.id === account.id ? 'bg-blue-25' : ''
              }`}
              id={`bank-option-${account.id}`}
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-14 font-medium text-gray-900">{account.name}</span>
                {account.bankName && (
                  <span className="text-12 text-gray-500">{account.bankName}</span>
                )}
              </div>
              {selected?.id === account.id && (
                <svg className="ml-auto size-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          {accounts.length === 0 && (
            <p className="px-4 py-3 text-14 text-gray-500">No bank accounts connected.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default BankDropdown
