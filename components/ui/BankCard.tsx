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
  showFooter = true,
  decorative = false,
}: CreditCardProps) => {
  const isSidebar = variant === "sidebar";
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
        "bank-card-wrapper--sidebar": isSidebar,
        "bank-card-wrapper--decorative": decorative,
      })}
      aria-hidden={decorative || undefined}
    >
      <Link
        href={`/transaction-history/?id=${account.supabaseItemId}`}
        tabIndex={decorative ? -1 : undefined}
        className={cn("bank-card group", finalGradient, {
          "bank-card--sidebar": isSidebar,
          "bank-card--decorative": decorative,
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

        {decorative ? (
          <div className="bank-card-decorative-chip" aria-hidden />
        ) : (
          <div
            className={cn("bank-card-body", {
              "bank-card-body--sidebar": isSidebar,
            })}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "bank-card-bank-name truncate font-medium uppercase tracking-wide text-white/70",
                    isSidebar ? "text-10" : "text-11"
                  )}
                >
                  {bankName}
                </p>
                <p
                  className={cn(
                    "bank-card-account-label truncate font-semibold text-white",
                    isSidebar ? "text-12" : "text-14"
                  )}
                >
                  {accountLabel}
                </p>
              </div>
              <div className="bank-card-chip" aria-hidden />
            </div>

            <div>
              <p className="bank-card-balance-label text-10 font-medium uppercase tracking-widest text-white/60">
                {showBalance ? "Available balance" : "Balance"}
              </p>
              <p
                className={cn(
                  "bank-card-balance font-ibm-plex-serif font-bold leading-tight text-white",
                  isSidebar ? "text-[22px]" : "text-[22px] md:text-24"
                )}
              >
                {showBalance ? (
                  <FormattedAmount
                    amount={account.currentBalance}
                    sourceCurrency={account.currencyCode}
                  />
                ) : (
                  <span aria-hidden>&bull;&bull;&bull;&bull;&bull;&bull;</span>
                )}
              </p>
            </div>

            <p className="bank-card-number font-mono text-15 font-medium tracking-[0.18em] text-white/95">
              &bull;&bull;&bull;&bull; &nbsp; &bull;&bull;&bull;&bull; &nbsp;
              &bull;&bull;&bull;&bull; &nbsp;
              <span className="text-16 font-semibold">{lastFour}</span>
            </p>

            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="bank-card-meta-label text-9 font-medium uppercase tracking-wider text-white/55">
                  Card holder
                </p>
                <p className="bank-card-meta-value truncate text-12 font-semibold uppercase text-white">
                  {userName}
                </p>
              </div>
              <div className="text-right">
                <p className="bank-card-meta-label text-9 font-medium uppercase tracking-wider text-white/55">
                  Valid thru
                </p>
                <p className="bank-card-meta-value text-12 font-semibold text-white">12/28</p>
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
        )}
      </Link>

      {showFooter && showBalance && shareableId ? (
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
