'use server';

import { createAdminClient, createSessionClient } from "@/lib/supabase/server";

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

    // ADIM B: 'users' tablosuna detayları ekleme
    // Not: RLS açık olabileceği için admin client ile insert yapıyoruz.
    const admin = await createAdminClient();
    const baseRow = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      // farklı isimlendirmeler için hepsini payload'a koyup
      // DB'nin tanımadığı kolonları hata geldikçe çıkaracağız
      postalCode: userData.postalCode,
      postal_code: userData.postalCode,
      dateOfBirth: userData.dateOfBirth,
      date_of_birth: userData.dateOfBirth,
      ssn: userData.ssn,
      userId: authData.user?.id,
      user_id: authData.user?.id,
      paymentCustomerId: 'pending',
      payment_customer_id: 'pending',
      paymentCustomerUrl: 'pending',
      payment_customer_url: 'pending',
    } as Record<string, any>;

    // adres/şehir isimleri projeden projeye değişebiliyor
    let row: Record<string, any> = {
      ...baseRow,
      address: userData.address,
      address1: userData.address,
      city: userData.state,
      state: userData.state,
    };

    const parseMissingColumn = (msg: string) => {
      const m = msg.match(/Could not find the '([^']+)' column of 'users'/);
      return m?.[1] ?? null;
    };

    let dbError: any = null;
    // eksik kolon hatası geldikçe o kolonu çıkarıp tekrar dene
    for (let i = 0; i < 12; i++) {
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
export const signIn = async ({ email, password }: signInProps): Promise<ActionResult<any>> => {
  try {
    const supabase = await createSessionClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

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

    // Kullanıcının tablodaki profil detaylarını çek (adres, ssn vb.)
    // Not: kolon isimleri projeden projeye değişebildiği için birkaç olası key deniyoruz.
    const candidateKeys = ['userId', 'user_id', 'auth_user_id'] as const;
    let userProfile: any = null;

    for (const key of candidateKeys) {
      // Supabase client generic tipleri burada TS'yi aşırı derinleştirebiliyor.
      // Bu akış için basit any cast ile runtime davranışını garanti ediyoruz.
      const query = (supabase as any).from('users').select('*').eq(key, user.id);
      const { data, error } = await query.maybeSingle();

      // "column not found" ise diğer key'e geç
      const msg = String((error as any)?.message || '');
      const isMissingColumn = msg.includes("Could not find the '") && msg.includes("column of 'users'");
      if (error && isMissingColumn) continue;

      // başka hata varsa logla ama auth'u yine de döndür (UI patlamasın)
      if (error) {
        console.error('Kullanıcı profili çekilemedi:', error);
        break;
      }

      if (data) {
        userProfile = data;
        break;
      }
    }

    // Auth ve Profil verilerini birleştirip gönder
    return JSON.parse(JSON.stringify({ ...user, ...userProfile }));
  } catch (error) {
    console.error("Kullanıcı oturumu alınamadı:", error);
    return null;
  }
}

// 4. ÇIKIŞ YAP
export const logoutAccount = async () => {
  try {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Çıkış yapılırken hata:", error);
    return null;
  }
}