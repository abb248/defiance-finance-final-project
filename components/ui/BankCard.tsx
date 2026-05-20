import Image from "next/image";
import Link from "next/link";

import Copy from "@/components/Copy";
import { FormattedAmount } from "@/components/FormattedAmount";
import { cn } from "@/lib/utilsz";

const gradients = [
  "bg-bank-gradient",
  "bg-bank-green-gradient",
  "bg-bank-purple-gradient",
  "bg-bank-orange-gradient",
  "bg-bank-pink-gradient",
  "bg-bank-emerald-gradient",
];

const getCardGradient = (accountId: string, override?: string) => {
  if (override) return override;
  const hash = accountId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const BankCard = ({
  account,
  userName,
  showBalance = true,
  gradientClass,
  variant = "default",
}: CreditCardProps) => {
  const accountId = String(account.supabaseItemId || account.id || "default");
  const finalGradient = getCardGradient(accountId, gradientClass);
  const lastFour =
    account.mask || String(account.supabaseItemId || account.id || "").slice(-4) || "0000";
  const bankName = account.bankName || "Bank";
  const accountLabel =
    account.name || account.subtype || account.officialName || "Account";
  const shareableId = account.shareableId || account.supabaseItemId || account.id;

  return (
    <div
      className={cn("bank-card-wrapper", {
        "bank-card-wrapper--sidebar": variant === "sidebar",
      })}
    >
      <Link
        href={`/transaction-history/?id=${account.supabaseItemId}`}
        className={cn("bank-card group", finalGradient, {
          "bank-card--sidebar": variant === "sidebar",
        })}
      >
        <div className="bank-card-glow" aria-hidden />
        <Image
          src="/icons/lines.png"
          width={316}
          height={190}
          alt=""
          className="bank-card-texture"
          aria-hidden
        />

        <div className="bank-card-body">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-11 font-medium uppercase tracking-wide text-white/70">
                {bankName}
              </p>
              <p className="truncate text-14 font-semibold text-white">
                {accountLabel}
              </p>
            </div>
            <div className="bank-card-chip" aria-hidden />
          </div>

          <div>
            <p className="text-10 font-medium uppercase tracking-widest text-white/60">
              {showBalance ? "Available balance" : "Balance"}
            </p>
            <p className="font-ibm-plex-serif text-22 font-bold leading-tight text-white md:text-24">
              {showBalance ? (
                <FormattedAmount amount={account.currentBalance} />
              ) : (
                "••••••"
              )}
            </p>
          </div>

          <p className="font-mono text-15 font-medium tracking-[0.18em] text-white/95">
            •••• &nbsp; •••• &nbsp; •••• &nbsp;
            <span className="text-16 font-semibold">{lastFour}</span>
          </p>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-9 font-medium uppercase tracking-wider text-white/55">
                Card holder
              </p>
              <p className="truncate text-12 font-semibold uppercase text-white">
                {userName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-9 font-medium uppercase tracking-wider text-white/55">
                Valid thru
              </p>
              <p className="text-12 font-semibold text-white">12/28</p>
            </div>
            <div className="bank-card-brand">
              <Image
                src="/icons/Paypass.svg"
                width={18}
                height={22}
                alt=""
                aria-hidden
              />
              <Image
                src="/icons/mastercard.svg"
                width={40}
                height={28}
                alt="Mastercard"
              />
            </div>
          </div>
        </div>
      </Link>

      {showBalance && shareableId ? (
        <div className="bank-card-footer">
          <p className="min-w-0 truncate text-12 text-gray-500">
            Shareable ID:{" "}
            <span className="font-medium text-gray-700">{shareableId}</span>
          </p>
          <Copy title={String(shareableId)} />
        </div>
      ) : null}
    </div>
  );
};

export default BankCard;
