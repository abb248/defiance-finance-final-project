"use client";
import { FormattedAmount } from '@/components/FormattedAmount';

import { Check, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utilsz";

type TransactionAccountSelectProps = {
  accounts: Account[];
  selectedId: string;
  allowAllAccounts?: boolean;
  totalCurrentBalance?: number;
};

const TransactionAccountSelect = ({
  accounts,
  selectedId,
  allowAllAccounts = false,
  totalCurrentBalance = 0,
}: TransactionAccountSelectProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAllSelected = allowAllAccounts && selectedId === "all";
  const selected = isAllSelected
    ? null
    : accounts.find((account) => account.supabaseItemId === selectedId) ||
      accounts[0];

  const title = isAllSelected
    ? "All accounts"
    : selected?.name || selected?.bankName || "Bank account";
  const shortName = title.slice(0, 2).toUpperCase();
  const balanceText = isAllSelected ? (
    <>
      {accounts.length} accounts - <FormattedAmount amount={totalCurrentBalance} />
    </>
  ) : (
    <FormattedAmount amount={selected?.currentBalance || 0} />
  );

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

  const getNextUrl = (nextId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", nextId);
    params.delete("page");
    return `/transaction-history?${params.toString()}`;
  };

  const handleSelect = (nextId: string) => {
    setIsOpen(false);
    router.push(getNextUrl(nextId));
  };

  return (
    <div ref={containerRef} className="relative w-full md:max-w-[300px]">
      <p className="mb-2 text-12 font-medium text-gray-600">Select account</p>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-12 font-bold text-white">
            {shortName}
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-14 font-semibold text-gray-900">{title}</p>
            <p className="text-12 text-gray-600">{balanceText}</p>
          </div>
        </div>
        <ChevronDown
          className={cn("size-5 shrink-0 text-gray-500 transition-transform", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {allowAllAccounts ? (
            <li role="option" aria-selected={isAllSelected}>
              <button
                type="button"
                onClick={() => handleSelect("all")}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                  { "bg-blue-25": isAllSelected }
                )}
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-12 font-bold text-white"
                >
                  AL
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-14 font-medium text-gray-900">
                    All accounts
                  </p>
                  <p className="text-12 text-gray-600">
                    {accounts.length} accounts - <FormattedAmount amount={totalCurrentBalance} />
                  </p>
                </div>

                {isAllSelected ? (
                  <Check className="size-5 shrink-0 text-blue-600" />
                ) : null}
              </button>
            </li>
          ) : null}

          {accounts.map((account) => {
            const isActive = account.supabaseItemId === selectedId;
            const accountTitle =
              account.name || account.bankName || "Bank account";

            return (
              <li key={account.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => handleSelect(account.supabaseItemId)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                    { "bg-blue-25": isActive }
                  )}
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-12 font-bold text-white"
                  >
                    {accountTitle.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-14 font-medium text-gray-900">
                      {accountTitle}
                    </p>
                    <p className="text-12 text-gray-600">
                      {account.bankName || account.subtype || "Account"} -{" "}
                      <FormattedAmount amount={account.currentBalance || 0} />
                    </p>
                  </div>

                  {isActive ? (
                    <Check className="size-5 shrink-0 text-blue-600" />
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

export default TransactionAccountSelect;
