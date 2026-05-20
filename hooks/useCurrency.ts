'use client';

import { useState, useEffect } from 'react';
import { getPreferredCurrency } from '@/lib/actions/currency.actions';

export const CURRENCY_CHANGED_EVENT = 'spendwise-currency-changed';

export const useCurrency = () => {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const fetchCurrency = async () => {
      const c = await getPreferredCurrency();
      setCurrency(c);
    };
    fetchCurrency();

    const handleCurrencyChange = (event: Event) => {
      const nextCurrency = (event as CustomEvent<string>).detail;
      if (nextCurrency) setCurrency(nextCurrency);
    };

    window.addEventListener(CURRENCY_CHANGED_EVENT, handleCurrencyChange);
    return () => {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurrencyChange);
    };
  }, []);

  return currency;
};
