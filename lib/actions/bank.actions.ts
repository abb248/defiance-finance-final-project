"use server";

import { createSaltEdgeCustomer } from "@/lib/actions/saltedge.actions";
import { convertAmount } from "@/lib/utilsz";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const BASE_URL = process.env.SALT_EDGE_BASE_URL || "https://www.saltedge.com/api/v6";

const SALT_EDGE_HEADERS = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "App-id": requireEnv("SALT_EDGE_APP_ID"),
  Secret: requireEnv("SALT_EDGE_SECRET"),
});

const parseJsonSafely = async (res: Response) => {
  const text = await res.text();
  try {
    return { json: text ? JSON.parse(text) : null, text };
  } catch {
    return { json: null, text };
  }
};

const saltEdgeGet = async (pathWithQuery: string) => {
  const response = await fetch(`${BASE_URL}${pathWithQuery}`, {
    method: "GET",
    headers: SALT_EDGE_HEADERS(),
    cache: "no-store",
  });

  const { json, text } = await parseJsonSafely(response);
  if (!response.ok) {
    const msg =
      (json && (json.error?.message || json.error?.class)) ||
      text ||
      `HTTP ${response.status}`;
    throw new Error(`Salt Edge API error: ${msg}`);
  }
  return json;
};

const paginate = async (path: string, params: Record<string, string>) => {
  const all: any[] = [];
  let fromId: string | null = null;

  for (let page = 0; page < 30; page++) {
    const qs = new URLSearchParams(params);
    qs.set("per_page", qs.get("per_page") || "150");
    if (fromId) qs.set("from_id", fromId);

    const res = await saltEdgeGet(`${path}?${qs.toString()}`);
    const chunk: any[] = Array.isArray(res?.data) ? res.data : [];
    all.push(...chunk);

    const nextPage: string | null = res?.meta?.next_page || null;
    if (!nextPage) break;

    const url = new URL(nextPage, "https://www.saltedge.com");
    fromId = url.searchParams.get("from_id");
    if (!fromId) break;
  }

  return all;
};

const inferTransactionCategory = ({
  category,
  description,
  paymentChannel,
  amount,
}: {
  category?: string | null;
  description: string;
  paymentChannel?: string | null;
  amount: number;
}) => {
  const existingCategory = String(category || "").trim();
  if (
    existingCategory &&
    !["uncategorized", "unknown", "other"].includes(existingCategory.toLowerCase())
  ) {
    return existingCategory;
  }

  const text = `${description} ${paymentChannel || ""}`.toLowerCase();

  if (amount > 0) return "Payment";

  if (
    /restaurant|cafe|coffee|wine|bar|lounge|noodle|spice|fruit|market|food|grocery|applegreen/.test(
      text
    )
  ) {
    return "Food and Drink";
  }

  if (/airline|hotel|travel|uber|lyft|taxi|train|rail|booking/.test(text)) {
    return "Travel";
  }

  if (/transfer|sent to|online banking/.test(text)) {
    return "Transfer";
  }

  if (/bill|payment|direct debit|water|gas|digital|communication|utility/.test(text)) {
    return "Payment";
  }

  if (/amazon|adobe|purchase|retail|gallery/.test(text)) {
    return "Shopping";
  }

  if (/fee|charge|interest/.test(text)) {
    return "Bank Fees";
  }

  return "Payment";
};

const mapSaltEdgeTransaction = (transaction: any) => {
  const amount = Number(transaction?.amount || 0);
  const description =
    transaction?.description ||
    transaction?.extra?.original_amount ||
    "Bank transaction";
  const paymentChannel = transaction?.extra?.posting_method || transaction?.mode || "other";

  return {
    id: String(transaction?.id),
    accountId: String(transaction?.account_id),
    name: description,
    amount: Math.abs(amount),
    signedAmount: amount,
    type: amount < 0 ? "debit" : "credit",
    status: transaction?.status || "posted",
    date: transaction?.made_on || transaction?.created_at || transaction?.updated_at,
    paymentChannel,
    category: inferTransactionCategory({
      category: transaction?.category,
      description,
      paymentChannel,
      amount,
    }),
    currencyCode: transaction?.currency_code || null,
    raw: transaction,
  };
};

const mapLocalTransaction = (transaction: any, accountId: string) => {
  const description = String(transaction.description || "Online Transfer");
  const amount = Math.abs(Number(transaction.amount) || 0);
  const isIncoming =
    description.includes(`Sent to: ${accountId}`) &&
    !description.includes(`From: ${accountId}`);

  return {
    id: String(transaction.id),
    accountId,
    name: description,
    amount,
    signedAmount: isIncoming ? amount : -amount,
    type: isIncoming ? "credit" : "debit",
    status: transaction.status || "success",
    date: transaction.created_at || new Date().toISOString(),
    paymentChannel: "online",
    category: "Transfer",
    currencyCode: transaction.currency || "TRY",
    raw: transaction,
  };
};

export const getAccounts = cache(async ({ email }: { email: string }) => {
  const customer = await createSaltEdgeCustomer(email);
  const customerId = customer?.customer_id;
  if (!customerId) return { data: [], totalBanks: 0, totalCurrentBalance: 0 };

  const connections = await paginate("/connections", { customer_id: String(customerId) });
  const accounts = await paginate("/accounts", { customer_id: String(customerId) });

  const byConnectionId = new Map<string, any>(
    connections.map((connection: any) => [String(connection?.id), connection])
  );

  const mapped = accounts.map((account: any) => {
    const connection = byConnectionId.get(String(account?.connection_id));
    const providerName = connection?.provider_name || connection?.provider_code;

    return {
      id: String(account?.id),
      supabaseItemId: String(account?.id),
      shareableId: String(account?.id),
      connectionId: String(account?.connection_id),
      name: account?.name || providerName || "Bank account",
      bankName: providerName || null,
      currentBalance: Number(account?.balance || 0),
      currencyCode: account?.currency_code || null,
      type: account?.nature || null,
      subtype: account?.nature || null,
      officialName: account?.extra?.account_name || account?.name || null,
      mask: String(account?.id || "").slice(-4),
      raw: account,
      connectionRaw: connection || null,
    };
  });

  const totalBanks = new Set(connections.map((connection: any) => String(connection?.id))).size;
  const totalCurrentBalance = mapped.reduce(
    (sum: number, account: any) =>
      sum +
      convertAmount(
        Number(account?.currentBalance) || 0,
        account?.currencyCode || "USD",
        "USD"
      ),
    0
  );

  return { data: mapped, totalBanks, totalCurrentBalance };
});

export const getRecipientAccounts = async ({ email }: { email: string }) => {
  try {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return [];

    const accounts = await getAccounts({ email: trimmedEmail });
    return JSON.parse(JSON.stringify(accounts?.data || []));
  } catch (error) {
    console.error("Recipient accounts could not be fetched:", error);
    return [];
  }
};

export const getAccount = cache(async ({
  supabaseItemId,
  connectionId,
  account,
}: {
  supabaseItemId: string;
  connectionId?: string | null;
  account?: any;
}) => {
  try {
    const currentAccount = account || {
      id: supabaseItemId,
      supabaseItemId,
      shareableId: supabaseItemId,
      name: "Bank Account",
      currentBalance: 0,
      officialName: "Personal Account",
      mask: String(supabaseItemId || "").slice(-4),
      type: "depository",
      subtype: "checking",
    };

    if (!connectionId) {
      return {
        data: currentAccount,
        transactions: [],
      };
    }

    const transactions = await paginate("/transactions", {
      connection_id: String(connectionId),
      account_id: String(supabaseItemId),
      per_page: "100",
    });

    const localTransferFilter = [
      `description.ilike.%From: ${supabaseItemId}%`,
      `description.ilike.%Sent to: ${supabaseItemId}%`,
    ].join(",");

    const { data: dbTransactions, error: dbTransactionsError } = await supabase
      .from("transactions")
      .select("*")
      .or(localTransferFilter);

    if (dbTransactionsError) {
      console.error("Supabase transactions could not be fetched:", dbTransactionsError);
    }

    const allTransactions = [
      ...(dbTransactions || []).map((transaction: any) =>
        mapLocalTransaction(transaction, String(supabaseItemId))
      ),
      ...transactions.map(mapSaltEdgeTransaction),
    ];

    return {
      data: currentAccount,
      transactions: allTransactions,
    };
  } catch (error) {
    console.error("Account details could not be fetched:", error);
    return null;
  }
});
