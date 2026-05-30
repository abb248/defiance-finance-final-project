import { FormattedAmount } from '@/components/FormattedAmount';
import Link from "next/link";

import { cn } from "@/lib/utilsz";

const BankTabItem = ({
  account,
  supabaseItemId,
  basePath = "/",
}: BankTabItemProps) => {
  const isActive = account.supabaseItemId === supabaseItemId;
  const title = account.name || account.bankName || "Bank account";
  const shortName = title.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`${basePath}?id=${account.supabaseItemId}`}
      className={cn("banktab-item min-w-fit", {
        "border-blue-600 bg-blue-25": isActive,
        "border-transparent bg-white": !isActive,
      })}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-12 font-bold text-white"
      >
        {shortName}
      </div>

      <div className="flex min-w-0 flex-col">
        <p className="max-w-[160px] truncate text-14 font-semibold text-gray-900">
          {title}
        </p>
        <p className="text-12 text-gray-600">
          <FormattedAmount
            amount={account.currentBalance || 0}
            sourceCurrency={account.currencyCode}
          />
        </p>
      </div>
    </Link>
  );
};

export default BankTabItem;
