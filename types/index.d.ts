declare type HeaderBoxProps = {
  type?: "title" | "greeting";
  title: string;
  subtext: string;
  user?: string;
};

declare type User = {
  id?: string;
  userID?: string;
  userId?: string;
  user_id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  [key: string]: any;
};

declare type Account = {
  id: string;
  supabaseItemId: string;
  shareableId?: string;
  connectionId?: string;
  name?: string;
  bankName?: string | null;
  currentBalance: number;
  currencyCode?: string | null;
  type?: string | null;
  subtype?: string | null;
  officialName?: string | null;
  mask?: string;
  [key: string]: any;
};

declare type Bank = Account;

declare type Transaction = {
  id: string;
  accountId?: string;
  name: string;
  amount: number;
  signedAmount?: number;
  type: "debit" | "credit" | string;
  status: string;
  date?: string;
  paymentChannel?: string;
  category?: string;
  currencyCode?: string | null;
  [key: string]: any;
};

declare interface RightSidebarProps {
  user: User;
  transactions: Transaction[];
  banks: Account[];
}

declare type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

type CreditCardProps = {
  account: {
    name?: string;
    currentBalance: number;
    [key: string]: any;
  };
  userName: string;
  showBalance?: boolean;
  gradientClass?: string;
};

declare interface DoughnutChartProps {
  accounts: Account[];
}

declare type RecentTransactionsProps = {
  accounts: Account[];
  transactions?: Transaction[];
  supabaseItemId?: string;
  page?: number;
};

declare type BankTabItemProps = {
  account: Account;
  supabaseItemId?: string;
};

declare type BankInfoProps = {
  account: Account;
};

declare type TransactionTableProps = {
  transactions?: Transaction[];
};

declare type CategoryBadgeProps = {
  category?: string;
};
