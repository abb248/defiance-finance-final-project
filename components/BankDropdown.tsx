"use client";

import { FormattedAmount } from "@/components/FormattedAmount";
import { Check, ChevronDown, Landmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn, getAccountIdentifier } from "@/lib/utilsz";

interface BankAccount {
  id: string;
  name?: string;
  currentBalance: number;
  bankName?: string | null;
  currencyCode?: string | null;
  supabaseItemId: string;
  shareableId?: string;
}

interface BankDropdownProps {
  accounts: BankAccount[];
  onChange?: (id: string | null, account: BankAccount | null) => void;
  value?: string;
  excludeAccountIds?: string[];
  placeholder?: string;
  otherStyles?: string;
}

const BankDropdown = ({
  accounts = [],
  onChange,
  value,
  excludeAccountIds = [],
  placeholder = "Select a bank",
  otherStyles,
}: BankDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => !excludeAccountIds.includes(getAccountIdentifier(account))
      ),
    [accounts, excludeAccountIds]
  );

  const selected = useMemo(() => {
    if (!value) return null;
    return (
      availableAccounts.find(
        (account) => getAccountIdentifier(account) === value
      ) || null
    );
  }, [availableAccounts, value]);

  const [displayed, setDisplayed] = useState<BankAccount | null>(
    selected || availableAccounts[0] || null
  );

  useEffect(() => {
    if (selected) {
      setDisplayed(selected);
      return;
    }

    if (!value) {
      setDisplayed(null);
    }
  }, [selected, value]);

  const handleSelect = (account: BankAccount) => {
    setDisplayed(account);
    setIsOpen(false);
    onChange?.(getAccountIdentifier(account), account);
  };

  return (
    <div className={`relative ${otherStyles || ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-form transition-all hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        id="bank-dropdown-trigger"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Landmark size={16} />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-14 font-medium text-gray-900">
              {displayed ? displayed.name : placeholder}
            </span>
            {displayed ? (
              <span className="block truncate text-12 text-gray-500">
                {displayed.bankName || "Account"} -{" "}
                <FormattedAmount
                  amount={displayed.currentBalance || 0}
                  sourceCurrency={displayed.currencyCode}
                />
              </span>
            ) : null}
          </div>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 text-gray-500 transition-transform", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {availableAccounts.map((account) => {
            const accountId = getAccountIdentifier(account);
            const isSelected = displayed
              ? getAccountIdentifier(displayed) === accountId
              : false;

            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleSelect(account)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-25",
                  { "bg-blue-25": isSelected }
                )}
                id={`bank-option-${account.id}`}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Landmark size={16} />
                </div>
                <div className="min-w-0 flex-1 flex-col">
                  <span className="truncate text-14 font-medium text-gray-900">
                    {account.name}
                  </span>
                  <span className="truncate text-12 text-gray-500">
                    {account.bankName || "Account"} -{" "}
                    <FormattedAmount
                      amount={account.currentBalance || 0}
                      sourceCurrency={account.currencyCode}
                    />
                  </span>
                </div>
                {isSelected ? (
                  <Check className="ml-auto size-5 shrink-0 text-blue-600" />
                ) : null}
              </button>
            );
          })}
          {availableAccounts.length === 0 ? (
            <p className="px-4 py-3 text-14 text-gray-500">
              No accounts available for this recipient.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default BankDropdown;
