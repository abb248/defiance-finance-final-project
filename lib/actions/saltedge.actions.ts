"use server";

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const SALT_EDGE_HEADERS = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "App-id": requireEnv("SALT_EDGE_APP_ID"),
  Secret: requireEnv("SALT_EDGE_SECRET"),
});

const BASE_URL = process.env.SALT_EDGE_BASE_URL || "https://www.saltedge.com/api/v6";

const parseJsonSafely = async (res: Response) => {
  const text = await res.text();
  try {
    return { json: text ? JSON.parse(text) : null, text };
  } catch {
    return { json: null, text };
  }
};

const saltEdgeFetch = async (path: string, init: RequestInit) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...SALT_EDGE_HEADERS(),
      ...(init.headers || {}),
    },
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

   const listAllCustomersUntilFound = async (identifier: string) => {
  // Salt Edge API v6 Customers "List" endpoint doesn't document an identifier filter query param.
  // We paginate and search in-memory by `identifier`.
  const perPage = 150;
  let fromId: string | null = null;

  for (let page = 0; page < 30; page++) {
    const qs = new URLSearchParams();
    qs.set("per_page", String(perPage));
    if (fromId) qs.set("from_id", fromId);

    const res = await saltEdgeFetch(`/customers?${qs.toString()}`, { method: "GET" });
    const customers: any[] = Array.isArray(res?.data) ? res.data : [];

    const match = customers.find((c) => c?.identifier === identifier);
    if (match) return match;

    const nextPage: string | null = res?.meta?.next_page || null;
    if (!nextPage) return null;

    // next_page looks like "/api/v6/customers?from_id=..."
    try {
      const url = new URL(nextPage, "https://www.saltedge.com");
      fromId = url.searchParams.get("from_id");
      if (!fromId) return null;
    } catch {
      return null;
    }
  }

  return null;
}; 

export const createSaltEdgeCustomer = async (identifier: string) => {
  // Salt Edge "DuplicatedCustomer" bazen non-2xx dönebiliyor; bu case'i özel ele alıyoruz.
  const response = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    headers: SALT_EDGE_HEADERS(),
    body: JSON.stringify({ data: { identifier } }),
    cache: "no-store",
  });

  const { json, text } = await parseJsonSafely(response);

  if (!response.ok) {
    if (json?.error?.class === "DuplicatedCustomer") {
      const customerIdFromError =
        json?.error?.extra?.customer_id || json?.error?.extra?.customerId;

      if (customerIdFromError) {
        const byId = await saltEdgeFetch(`/customers/${customerIdFromError}`, {
          method: "GET",
        });
        console.log("[saltedge] duplicated customer, fetched by id", {
          identifier,
          customer_id: byId?.data?.customer_id,
        });
        return byId?.data || null;
      }

      const existing = await listAllCustomersUntilFound(identifier);
      console.log("[saltedge] duplicated customer, scanned list for identifier", {
        identifier,
        customer_id: existing?.customer_id,
      });
      return existing || null;
    }

    const msg =
      (json && (json.error?.message || json.error?.class)) ||
      text ||
      `HTTP ${response.status}`;
    throw new Error(`Salt Edge API error: ${msg}`);
  }

  if (json?.error?.class === "DuplicatedCustomer") {
    const customerIdFromError =
      json?.error?.extra?.customer_id || json?.error?.extra?.customerId;

    if (customerIdFromError) {
      const byId = await saltEdgeFetch(`/customers/${customerIdFromError}`, {
        method: "GET",
      });
      console.log("[saltedge] duplicated customer (2xx), fetched by id", {
        identifier,
        customer_id: byId?.data?.customer_id,
      });
      return byId?.data || null;
    }

    const existing = await listAllCustomersUntilFound(identifier);
    console.log("[saltedge] duplicated customer (2xx), scanned list for identifier", {
      identifier,
      customer_id: existing?.customer_id,
    });
    return existing || null;
  }

  console.log("[saltedge] created customer", { identifier, customer_id: json?.data?.customer_id });
  return json?.data || null;
};

export const createConnectSession = async (customerId: string, returnTo?: string) => {
  const effectiveReturnTo =
    returnTo ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  // Salt Edge API v6 returns connect_url via Connections/connect
  const result = await saltEdgeFetch("/connections/connect", {
    method: "POST",
    body: JSON.stringify({
      data: {
        customer_id: String(customerId),
        consent: {
          // v6 allowed scopes: holder_info, accounts, transactions
          scopes: ["accounts", "transactions"],
        },
        attempt: {
          // Optional but helps many providers
          fetch_scopes: ["accounts", "transactions"],
          return_to: effectiveReturnTo,
        },
      },
    }),
  });

  const connectUrl = result?.data?.connect_url;
  if (!connectUrl) {
    console.log("[saltedge] connect session response missing connect_url", {
      customerId,
      returnTo: effectiveReturnTo,
      result,
    });
    throw new Error(
      `Salt Edge connect_url missing. Response: ${JSON.stringify(result)}`
    );
  }

  console.log("[saltedge] connect session created", {
    customerId,
    returnTo: effectiveReturnTo,
  });
  return connectUrl;
};