"use server";

// Verilen anahtarın (key) .env dosyasında olup olmadığını kontrol eder 
// Eğer yoksa bunu bildirir. 
const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

// Salt Edge API'sine gönderilecek headers hszırlar. 
const SALT_EDGE_HEADERS = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "App-id": requireEnv("SALT_EDGE_APP_ID"),
  Secret: requireEnv("SALT_EDGE_SECRET"),
});


const BASE_URL = process.env.SALT_EDGE_BASE_URL || "https://www.saltedge.com/api/v6";

// API'den gelen yanıtı güvenli bir şekilde JSON'a çevirdik. 
// Eğer API çöker ve JSON yerine düz metin/HTML dönerse try-catch sayesinde uygulamanın çökmesini engeller.
const parseJsonSafely = async (res: Response) => {
  const text = await res.text();
  try {
    return { json: text ? JSON.parse(text) : null, text };
  } catch {
    return { json: null, text };
  }
};

// Fetch fonksiyonumuz, bizim yaptığımız
// Her defasında header yazmamak için wrapper kullandık.
const saltEdgeFetch = async (path: string, init: RequestInit) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...SALT_EDGE_HEADERS(),
      ...(init.headers || {}),
    },
    cache: "no-store", // Verilerin cache alınmasını engeller, hep güncel veri çeker.
  });

  const { json, text } = await parseJsonSafely(response);

  // Yanıt 2xx (Başarılı) değilse, hatayı yakalayıp fırlatır.
  if (!response.ok) {
    const msg =
      (json && (json.error?.message || json.error?.class)) ||
      text ||
      `HTTP ${response.status}`;
    throw new Error(`Salt Edge API error: ${msg}`);
  }

  return json;
};

// Eğer Salt Edge'de aynı müşteri zaten varsa ve sistem bize o müşterinin ID'sini
// direkt vermezse, bu fonksiyon devreye girer. Tüm müşteri listesini sayfa sayfa gezip
// verdiğimiz 'identifier' (örneğin e-posta) ile eşleşen kullanıcıyı bulana kadar tarar.
const listAllCustomersUntilFound = async (identifier: string) => {
  
  const perPage = 150; // Her sayfada çekilecek maksimum müşteri sayısı
  let fromId: string | null = null; // pagination için başlangıç ID'si

  // Sonsuz döngüye girmemek için maksimum 30 sayfa arama sınırı koyduk.
  for (let page = 0; page < 30; page++) {
    const qs = new URLSearchParams();
    qs.set("per_page", String(perPage));
    if (fromId) qs.set("from_id", fromId);

    const res = await saltEdgeFetch(`/customers?${qs.toString()}`, { method: "GET" });
    const customers: any[] = Array.isArray(res?.data) ? res.data : [];

    // Çekilen listede aradığımız müşteriyi bulursak direkt onu döndr.
    const match = customers.find((c) => c?.identifier === identifier);
    if (match) return match;

    // next_page verisi yoksa arama biter.
    const nextPage: string | null = res?.meta?.next_page || null;
    if (!nextPage) return null;

    
    // Sonraki sayfanın linkinden 'from_id' parametresini koparıp döngünün sonraki turuna aktarmak için. 
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

// Sitemize yeni biri kayıt olduğunda onu Salt Edge sistemine müşteri olarak kaydetmesi için kullanıyoruz 
export const createSaltEdgeCustomer = async (identifier: string) => {
  // Salt Edge "DuplicatedCustomer" bazen non-2xx dönebiliyor bu büyük sorun yarattı bir türlü giremedik. bu yüzden ihtiysç oldu.
  const response = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    headers: SALT_EDGE_HEADERS(),
    body: JSON.stringify({ data: { identifier } }),
    cache: "no-store",
  });

  const { json, text } = await parseJsonSafely(response);

  // SENARYO 1: İşlem HTTP hatası döndürdüyse
  if (!response.ok) {
    // Eğer hata bu müşteri zaten var ise:
    if (json?.error?.class === "DuplicatedCustomer") {
      const customerIdFromError =
        json?.error?.extra?.customer_id || json?.error?.extra?.customerId;

      // Hata mesajının içinde var olan müşterinin ID'si geldiyse, direkt o ID ile müşteriyi getir.
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

      // Hata mesajında ID yoksa, kaba kuvvet arama motorunu çalıştır ve listeyi tara.
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

  // SENARYO 2: Yanıt 2xx döndü ama içinde "DuplicatedCustomer" uyarısı var (Salt Edge'in garip bir davranışı)
  if (json?.error?.class === "DuplicatedCustomer") {
    const customerIdFromError =
      json?.error?.extra?.customer_id || json?.error?.extra?.customerId;

    // Üstteki mantığın aynısı
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

    // ID yoksa listeyi tara.
    const existing = await listAllCustomersUntilFound(identifier);
    console.log("[saltedge] duplicated customer (2xx), scanned list for identifier", {
      identifier,
      customer_id: existing?.customer_id,
    });
    return existing || null;
  }

  // SENARYO 3: müşteri sıfırdan başarıyla oluşturuldu.
  console.log("[saltedge] created customer", { identifier, customer_id: json?.data?.customer_id });
  return json?.data || null;
};



// Kullanıcı arayüzde "Banka Bağla" butonuna bastığında Salt Edge bağla
export const createConnectSession = async (customerId: string, returnTo?: string) => {
  // İşlem bitince kullanıcının bizim sitemizde nereye yönlendirileceğini belirler
  const effectiveReturnTo =
    returnTo ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";


  const result = await saltEdgeFetch("/connections/connect", {
    method: "POST",
    body: JSON.stringify({
      data: {
        customer_id: String(customerId),
        consent: {
        
          // Hangi verilere erişim izni istediğimiz
          scopes: ["accounts", "transactions"],
        },
        attempt: {
          
          fetch_scopes: ["accounts", "transactions"],
          return_to: effectiveReturnTo,
        },
      },
    }),
  });

  const connectUrl = result?.data?.connect_url;
  
  // Eğer bağlantı URL'i oluşmadıysa log at ve hata fırlat
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

  // URL başarıyla oluştuysa log at ve URL'i döndür
  console.log("[saltedge] connect session created", {
    customerId,
    returnTo: effectiveReturnTo,
  });
  return connectUrl;
};