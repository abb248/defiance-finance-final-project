"use server";

import { createSaltEdgeCustomer } from "@/lib/actions/saltedge.actions";

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

export const getAccounts = async ({ email }: { email: string }) => {
  // 1) Ensure customer exists (identifier = email)
  const customer = await createSaltEdgeCustomer(email);
  const customerId = customer?.customer_id;
  if (!customerId) return { data: [], totalBanks: 0, totalCurrentBalance: 0 };

  // 2) Pull connections + accounts directly from Salt Edge
  const connections = await paginate("/connections", { customer_id: String(customerId) });
  const accounts = await paginate("/accounts", { customer_id: String(customerId) });

  const byConnectionId = new Map<string, any>(
    connections.map((c: any) => [String(c?.id), c])
  );

  // 3) Map to UI-friendly shape (BankCard expects `name` + `currentBalance`)
  const mapped = accounts.map((a: any) => {
    const connection = byConnectionId.get(String(a?.connection_id));
    const providerName = connection?.provider_name || connection?.provider_code;

    return {
      id: String(a?.id),
      supabaseItemId: String(a?.id), // existing pages use this as "selected account id"
      connectionId: String(a?.connection_id),
      name: a?.name || providerName || "Bank account",
      bankName: providerName || null,
      currentBalance: Number(a?.balance || 0),
      currencyCode: a?.currency_code || null,
      raw: a,
      connectionRaw: connection || null,
    };
  });

  const totalBanks = new Set(connections.map((c: any) => String(c?.id))).size;
  const totalCurrentBalance = mapped.reduce(
    (sum: number, a: any) => sum + (Number(a?.currentBalance) || 0),
    0
  );

  return { data: mapped, totalBanks, totalCurrentBalance };
};

export const getAccount = async ({ supabaseItemId }: { supabaseItemId: string }) => {
  try {
    // İleride burası Salt Edge veya veritabanından gerçek detayları çekecek.
    // Şimdilik UI'ın kırılmaması ve kopyalama butonunun çalışması için:
    
    const account = {
      id: supabaseItemId,
      supabaseItemId: supabaseItemId,
      shareableId: supabaseItemId, // İŞTE BUTON BURAYI KOPYALIYOR!
      name: "Banka Hesabı", // Sayfada "null" yerine bu yazar
      currentBalance: 0,    // Şimdilik 0, transactionlar gelince dolacak
      officialName: "Personal Checking Account",
      mask: "1234",
      type: "depository",
      subtype: "checking",
    };

    return {
      data: account,
      transactions: [], // Zeynep burayı doldurduğunda harcamalar görünecek
    };
  } catch (error) {
    console.error("Hesap detayları alınırken hata:", error);
    return null;
  }
 
  
};
