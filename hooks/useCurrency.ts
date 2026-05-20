'use client';

import { useState, useEffect } from 'react';
import { getPreferredCurrency } from '@/lib/actions/currency.actions';

export const useCurrency = () => {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const fetchCurrency = async () => {
      const c = await getPreferredCurrency();
      setCurrency(c);
    };
    fetchCurrency();
  }, []);

  return currency;
};
