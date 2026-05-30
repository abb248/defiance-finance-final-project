"use client";
import { FormattedAmount } from '@/components/FormattedAmount';

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utilsz";

type HomeAccountMoreSelectProps = {
  accounts: Account[];
  selectedId: string;
};

const HomeAccountMoreSelect = ({
  accounts,
  selectedId,
}: HomeAccountMoreSelectProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedInList = accounts.find(
    (account) => account.supabaseItemId === selectedId
  );
  const label = selectedInList
    ? selectedInList.name || selectedInList.bankName || "Account"
    : "More accounts";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (account: Account) => {
    setIsOpen(false);
    router.push(`/?id=${account.supabaseItemId}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "banktab-item min-w-[140px] rounded-lg border px-3 py-2",
          selectedInList
            ? "border-blue-600 bg-blue-25"
            : "border-gray-200 bg-white"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate text-14 font-semibold text-gray-900">
          {label}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-gray-500 transition-transform", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {accounts.map((account) => {
            const isActive = account.supabaseItemId === selectedId;
            const accountTitle =
              account.name || account.bankName || "Bank account";

            return (
              <li key={account.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => handleSelect(account)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                    { "bg-blue-25": isActive }
                  )}
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-12 font-bold text-white"
                  >
                    {accountTitle.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-14 font-medium text-gray-900">
                      {accountTitle}
                    </p>
                    <p className="text-12 text-gray-600">
                      <FormattedAmount
                        amount={account.currentBalance || 0}
                        sourceCurrency={account.currencyCode}
                      />
                    </p>
                  </div>

                  {isActive ? (
                    <Check className="size-4 shrink-0 text-blue-600" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default HomeAccountMoreSelect;
