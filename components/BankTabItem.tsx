import Link from "next/link";

import { cn, formatAmount } from "@/lib/utilsz";

const BankTabItem = ({ account, supabaseItemId }: BankTabItemProps) => {
  const isActive = account.supabaseItemId === supabaseItemId;
  const title = account.name || account.bankName || "Bank account";
  const shortName = title.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/?id=${account.supabaseItemId}`}
      className={cn("banktab-item min-w-fit", {
        "border-blue-600 bg-blue-25": isActive,
        "border-transparent bg-white": !isActive,
      })}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-12 font-bold",
          {
            "bg-blue-600 text-white": isActive,
            "bg-gray-200 text-gray-700": !isActive,
          }
        )}
      >
        {shortName}
      </div>

      <div className="flex min-w-0 flex-col">
        <p className="max-w-[160px] truncate text-14 font-semibold text-gray-900">
          {title}
        </p>
        <p className="text-12 text-gray-600">
          {formatAmount(account.currentBalance || 0)}
        </p>
      </div>
    </Link>
  );
};

export default BankTabItem;
