"use server";

const SALT_EDGE_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "App-id": process.env.SALT_EDGE_APP_ID!,
  "Secret": process.env.SALT_EDGE_SECRET!,
};

const BASE_URL = "https://www.saltedge.com/api/v6";

export const createSaltEdgeCustomer = async (identifier: string) => {
  try {
    const response = await fetch(`${BASE_URL}/customers`, {
      method: "POST",
      headers: SALT_EDGE_HEADERS,
      body: JSON.stringify({ data: { identifier } }),
    });
    
    const result = await response.json();

    if (result.error && result.error.class === 'DuplicatedCustomer') {
      const getResponse = await fetch(`${BASE_URL}/customers?identifier=${identifier}`, {
        method: "GET",
        headers: SALT_EDGE_HEADERS,
      });
      const getResult = await getResponse.json();
      return getResult.data?.[0] || null;
    }

    return result.data || null;
  } catch (error) {
    return null;
  }
};

export const createConnectSession = async (customerId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/connect_sessions/create`, {
      method: "POST",
      headers: SALT_EDGE_HEADERS,
      body: JSON.stringify({
        data: {
          customer_id: String(customerId),
          consent: {
            scopes: ["account_details", "transactions_details"]
          },
          attempt: {
            // Tarayıcında 3001 portunda çalıştığını varsayıyoruz
            return_to: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000/" 
          }
        }
      }),
    });

    const result = await response.json();
    return result.data?.connect_url || null;
  } catch (error) {
    return null;
  }
};