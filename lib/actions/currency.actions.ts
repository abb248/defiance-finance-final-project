'use server'

import { cookies } from 'next/headers';

export const setPreferredCurrency = async (currency: string) => {
  cookies().set('preferred_currency', currency, { path: '/', maxAge: 60 * 60 * 24 * 365 }); // 1 year
};

export const getPreferredCurrency = async () => {
  const cookieStore = cookies();
  const currency = cookieStore.get('preferred_currency')?.value;
  return currency || 'USD';
};
