import { FormattedAmount } from '@/components/FormattedAmount';

const BankInfo = ({ account }: BankInfoProps) => {
  const title = account.name || account.bankName || "Bank account";
  const accountType = account.subtype || account.type || "account";

  return (
    <div className="bank-info rounded-lg">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-16 font-bold text-white">
        {title.slice(0, 2).toUpperCase()}
      </div>

      <div className="bank-info_content">
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-18 font-semibold text-gray-900">
            {title}
          </h3>
          <p className="text-14 capitalize text-gray-600">
            {account.bankName || accountType}
          </p>
        </div>

        <div className="flex shrink-0 flex-col text-right">
          <p className="text-12 text-gray-600">Current Balance</p>
          <p className="text-16 font-semibold text-gray-900">
            <FormattedAmount
              amount={account.currentBalance || 0}
              sourceCurrency={account.currencyCode}
            />
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankInfo;
