'use server';

import { createAdminClient, createSessionClient } from "@/lib/supabase/server";
import { createStripeCustomer } from "./stripe.actions";

// --- TİP TANIMLAMALARI (Hataları önlemek için) ---
interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
}

interface signInProps {
  email: string;
  password: string;
}

type ActionResult<T> = { user: T | null; error: string | null };

// --- FONKSİYONLAR ---

// 1. KAYIT OL
export const signUp = async ({ password, ...userData }: SignUpParams): Promise<ActionResult<any>> => {
  const { email } = userData;

  try {
    const supabase = await createSessionClient();

    // ADIM A: Supabase Auth kaydı
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;

    // YENİ ADIM: STRIPE MÜŞTERİSİ OLUŞTURUYORUZ!
    // Supabase kaydı başarılıysa, Stripe'da bu kullanıcı için bir cüzdan açıyoruz
    const stripeCustomer = await createStripeCustomer({
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
    });

    // ADIM B: 'users' tablosuna detayları ekleme
    const admin = await createAdminClient();
    const baseRow = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      // farklı isimlendirmeler için hepsini payload'a koyup
      // DB'nin tanımadığı kolonları hata geldikçe çıkar
      postalCode: userData.postalCode,
      postal_code: userData.postalCode,
      dateOfBirth: userData.dateOfBirth,
      date_of_birth: userData.dateOfBirth,
      ssn: userData.ssn,
      userID: authData.user?.id, 
      userId: authData.user?.id, 
      user_id: authData.user?.id,
      // 'pending' YERİNE STRIPE BİLGİLERİNİ GİRİYORUZ!
      paymentCustomerId: stripeCustomer.id,
      payment_customer_id: stripeCustomer.id,
      paymentCustomerUrl: `https://dashboard.stripe.com/test/customers/${stripeCustomer.id}`,
      payment_customer_url: `https://dashboard.stripe.com/test/customers/${stripeCustomer.id}`,
    } as Record<string, any>;
    
    // adres/şehir isimleri projeden projeye değişebiliyor, o yüzden ikisini de ekliyoruz
    let row: Record<string, any> = {
      ...baseRow,
      address: userData.address,
      address1: userData.address,
      city: userData.state,
      state: userData.state,
    };

    // Hata mesajından eksik kolonu parse edip ona göre denemek için bir fonksiyon
    const parseMissingColumn = (msg: string) => {
      // Örn: "column users.userId does not exist" hatasından "userId" kısmını çeker
      const match1 = msg.match(/column (?:users\.)?["']?([^"'\s]+)["']? does not exist/);
      if (match1) return match1[1];
      
      const match2 = msg.match(/Could not find the '([^']+)' column/);
      return match2?.[1] ?? null;
    };

    let dbError: any = null;
    
    // eksik kolon hatası geldikçe o kolonu çıkarıp tekrar denemek için
    for (let i = 0; i < 15; i++) {
      const { error } = await admin.from('users').insert(row);
      if (!error) {
        dbError = null;
        break;
      }

      dbError = error;
      const msg = String(error?.message || '');
      const missing = parseMissingColumn(msg);
      
      if (!missing) break;

      // döngüye takılmamak için gerçekten payload'da varsa sil
      if (Object.prototype.hasOwnProperty.call(row, missing)) {
        delete row[missing];
        continue;
      }
      break;
    }

    if (dbError) throw dbError;

    return { user: JSON.parse(JSON.stringify(authData.user)), error: null };

  } catch (error: any) {
    console.error('Kayıt olurken bir hata oluştu:', error);
    const message =
      error?.message ||
      (typeof error === 'string' ? error : null) ||
      'Kayıt olurken bir hata oluştu.';
    return { user: null, error: message };
  }
}


// 2. GİRİŞ YAP
export const signIn = async ({ email, password }: signInProps): Promise<ActionResult<any> & { requiresMfa?: boolean, factorId?: string }> => {
  try {
    const supabase = await createSessionClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if MFA is required
    const mfaData = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfaData.data?.nextLevel === 'aal2' && mfaData.data?.currentLevel === 'aal1') {
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data?.totp?.[0];

      if (totpFactor) {
        return { user: null, error: null, requiresMfa: true, factorId: totpFactor.id };
      }
    }

    return { user: JSON.parse(JSON.stringify(data.user)), error: null };
  } catch (error: any) {
    console.error('Giriş yapılırken hata oluştu:', error);
    const message =
      error?.message ||
      (typeof error === 'string' ? error : null) ||
      'Giriş yapılırken hata oluştu.';
    return { user: null, error: message };
  }
}

// 3. OTURUMU KONTROL ET
export const getLoggedInUser = async () => {
  try {
    const supabase = await createSessionClient();
    
    // Aktif oturumu çek
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Kullanıcının tablodaki profil detaylarını çek
    const candidateKeys = ['userID', 'userId', 'user_id', 'auth_user_id'] as const;
    let userProfile: any = null;

    for (const key of candidateKeys) {
      const query = (supabase as any).from('users').select('*').eq(key, user.id);
      const { data, error } = await query.maybeSingle();

      // Hata kodunu (42703) ve PostgreSQL hata mesajlarını doğru yakalama
      const msg = String((error as any)?.message || '');
      const code = String((error as any)?.code || '');
      const isMissingColumn = code === '42703' || msg.includes('does not exist') || msg.includes("Could not find");
      
      if (error && isMissingColumn) continue;

      if (error) {
        console.error('Kullanıcı profili çekilemedi:', error);
        break;
      }

      if (data) {
        userProfile = data;
        break;
      }
    }

    return JSON.parse(JSON.stringify({ ...user, ...userProfile }));
  } catch (error) {
    console.error("Kullanıcı oturumu alınamadı:", error);
    return null;
  }
}


export const logoutAccount = async () => {
  try {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Çıkış yapılırken hata:", error);
    return null;
  }
}

export const enroll2FA = async () => {
  try {
    const supabase = await createSessionClient();

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'SpendWise',
    });

    if (error) throw error;
    
    return JSON.parse(JSON.stringify(data)); 
  } catch (error) {
    console.error("2FA Kayıt Hatası:", error);
    return null;
  }
};

export const challenge2FA = async (factorId: string) => {
  try {
    const supabase = await createSessionClient();
    
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    
    if (error) throw error;
    
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("2FA Challenge Hatası:", error);
    return null;
  }
};

export const verify2FA = async (factorId: string, challengeId: string, code: string) => {
  try {
    const supabase = await createSessionClient();

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) throw error;
    
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("2FA Doğrulama Hatası:", error);
    return null;
  }
};

export const getMfaStatus = async () => {
  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (error) throw error;
    
    // nextLevel 'aal2' ise kullanıcının halihazırda onaylanmış bir 2FA faktörü var demektir.
    return data.nextLevel === 'aal2';
  } catch (error) {
    console.error("MFA durumu alınamadı:", error);
    return false;
  }
};