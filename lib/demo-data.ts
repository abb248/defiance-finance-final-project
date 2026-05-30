import type {
  StoredPlannerState,
} from "@/lib/budget-utils";

export const DEMO_USER_EMAIL = "ayse1@gmail.com";

export const isDemoUserEmail = (email?: string | null) =>
  String(email || "").trim().toLowerCase() === DEMO_USER_EMAIL;

const getIsoDaysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const getInputDateDaysFromNow = (days: number) =>
  getIsoDaysFromNow(days).slice(0, 10);

export const getDemoAccounts = (): Account[] => [
  {
    id: "demo-checking",
    supabaseItemId: "demo-checking",
    shareableId: "DEMO-AYSE-CHECKING",
    connectionId: "demo-connection",
    name: "Everyday Checking",
    bankName: "Defiance Demo Bank",
    currentBalance: 4280.45,
    currencyCode: "USD",
    type: "depository",
    subtype: "checking",
    officialName: "Ayse Everyday Checking",
    mask: "2845",
    isDemoFallback: true,
  },
  {
    id: "demo-savings",
    supabaseItemId: "demo-savings",
    shareableId: "DEMO-AYSE-SAVINGS",
    connectionId: "demo-connection",
    name: "Goal Savings",
    bankName: "Defiance Demo Bank",
    currentBalance: 7850,
    currencyCode: "USD",
    type: "depository",
    subtype: "savings",
    officialName: "Ayse Goal Savings",
    mask: "9120",
    isDemoFallback: true,
  },
];

const demoTransactions: Transaction[] = [
  {
    id: "demo-tx-salary",
    accountId: "demo-checking",
    name: "Monthly salary",
    amount: 3200,
    signedAmount: 3200,
    type: "credit",
    status: "posted",
    date: getIsoDaysFromNow(-2),
    paymentChannel: "direct deposit",
    category: "Payment",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-rent",
    accountId: "demo-checking",
    name: "Apartment rent",
    amount: 1250,
    signedAmount: -1250,
    type: "debit",
    status: "posted",
    date: getIsoDaysFromNow(-4),
    paymentChannel: "online",
    category: "Payment",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-market",
    accountId: "demo-checking",
    name: "Local market and groceries",
    amount: 186.4,
    signedAmount: -186.4,
    type: "debit",
    status: "posted",
    date: getIsoDaysFromNow(-6),
    paymentChannel: "card",
    category: "Food and Drink",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-coffee",
    accountId: "demo-checking",
    name: "Campus coffee",
    amount: 18.75,
    signedAmount: -18.75,
    type: "debit",
    status: "posted",
    date: getIsoDaysFromNow(-8),
    paymentChannel: "card",
    category: "Food and Drink",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-shopping",
    accountId: "demo-checking",
    name: "Bookstore supplies",
    amount: 92.3,
    signedAmount: -92.3,
    type: "debit",
    status: "posted",
    date: getIsoDaysFromNow(-10),
    paymentChannel: "card",
    category: "Shopping",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-transfer-out",
    accountId: "demo-checking",
    name: "Online Transfer - From: demo-checking - Sent to: demo-savings - Reference: DF-DEMO-1042 - Note: Monthly savings",
    amount: 450,
    signedAmount: -450,
    type: "debit",
    status: "success",
    date: getIsoDaysFromNow(-1),
    paymentChannel: "online",
    category: "Transfer",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-transfer-in",
    accountId: "demo-savings",
    name: "Online Transfer - From: demo-checking - Sent to: demo-savings - Reference: DF-DEMO-1042 - Note: Monthly savings",
    amount: 450,
    signedAmount: 450,
    type: "credit",
    status: "success",
    date: getIsoDaysFromNow(-1),
    paymentChannel: "online",
    category: "Transfer",
    currencyCode: "USD",
  },
  {
    id: "demo-tx-interest",
    accountId: "demo-savings",
    name: "Savings interest",
    amount: 12.8,
    signedAmount: 12.8,
    type: "credit",
    status: "posted",
    date: getIsoDaysFromNow(-5),
    paymentChannel: "bank",
    category: "Payment",
    currencyCode: "USD",
  },
];

export const isDemoAccountId = (accountId?: string | null) =>
  getDemoAccounts().some(
    (account) =>
      account.supabaseItemId === accountId ||
      account.shareableId === accountId ||
      account.id === accountId
  );

export const getDemoAccountById = (accountId?: string | null) =>
  getDemoAccounts().find(
    (account) =>
      account.supabaseItemId === accountId ||
      account.shareableId === accountId ||
      account.id === accountId
  ) || null;

export const getDemoTransactionsForAccount = (accountId?: string | null) => {
  const account = getDemoAccountById(accountId);
  if (!account) return [];

  return demoTransactions
    .filter((transaction) => transaction.accountId === account.supabaseItemId)
    .map((transaction) => ({
      ...transaction,
      accountName: account.name,
    }));
};

export const getDemoPlannerState = (): StoredPlannerState => ({
  budgets: [
    {
      id: "demo-budget-food",
      category: "Food and Drink",
      monthlyLimit: 260,
    },
    {
      id: "demo-budget-shopping",
      category: "Shopping",
      monthlyLimit: 120,
    },
    {
      id: "demo-budget-payment",
      category: "Payment",
      monthlyLimit: 1500,
    },
  ],
  savingsGoals: [
    {
      id: "1700000000000",
      name: "Emergency fund",
      targetAmount: 10000,
      currentAmount: 7850,
      targetDate: getInputDateDaysFromNow(120),
    },
    {
      id: "1701000000000",
      name: "Graduation trip",
      targetAmount: 2500,
      currentAmount: 650,
      targetDate: getInputDateDaysFromNow(45),
    },
  ],
  subscriptions: [
    {
      id: "demo-sub-internet",
      name: "Home internet",
      amount: 65,
      category: "Payment",
      dueDate: getInputDateDaysFromNow(5),
      frequency: "monthly",
      accountName: "Everyday Checking",
      isPaid: false,
    },
    {
      id: "demo-sub-streaming",
      name: "Streaming bundle",
      amount: 18,
      category: "Shopping",
      dueDate: getInputDateDaysFromNow(18),
      frequency: "monthly",
      accountName: "Everyday Checking",
      isPaid: false,
    },
  ],
});
