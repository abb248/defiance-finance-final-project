declare type HeaderBoxProps = {
  type?: "title" | "greeting";
  title: string;
  subtext: string;
  user?: string;
};

declare interface RightSidebarProps {
  user: User;
  transactions: Transaction[];
  banks: Bank[] & Account[];
}

declare type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

type CreditCardProps = {
  account: {
    name?: string
    currentBalance: number
    [key: string]: any
  }
  userName: string
  showBalance?: boolean
  gradientClass?: string
}

declare interface DoughnutChartProps {
  accounts: Account[];
}