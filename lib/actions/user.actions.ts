'use server';

import { createSessionClient } from "@/lib/supabase/server";

// --- TİP TANIMLAMALARI (Hataları önlemek için) ---
interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
}

interface signInProps {
  email: string;
  password: string;
}

// --- FONKSİYONLAR ---

// 1. KAYIT OL
export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  try {
    
    const supabase = await createSessionClient();

    // ADIM A: Supabase Auth kaydı
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // ADIM B: 'users' tablosuna detayları ekleme
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        ...userData,
        userId: authData.user?.id,
        paymentCustomerId: 'pending', 
        paymentCustomerUrl: 'pending'
      });

    if (dbError) throw dbError;

    return JSON.parse(JSON.stringify(authData.user));

  } catch (error) {
    console.error('Kayıt olurken bir hata oluştu:', error);
    return null;
  }
}

// 2. GİRİŞ YAP
export const signIn = async ({ email, password }: signInProps) => {
  try {
    const supabase = await createSessionClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return JSON.parse(JSON.stringify(data.user));
  } catch (error) {
    console.error('Giriş yapılırken hata oluştu:', error);
    return null;
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
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('userId', user.id)
      .single();

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