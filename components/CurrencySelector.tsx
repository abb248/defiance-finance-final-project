'use client';

import React, { useState, useEffect } from 'react';
import { setPreferredCurrency, getPreferredCurrency } from '@/lib/actions/currency.actions';
import { useRouter } from 'next/navigation';

const currencies = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
];

const CurrencySelector = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const router = useRouter();

  useEffect(() => {
    const fetchCurrency = async () => {
      const currency = await getPreferredCurrency();
      setSelectedCurrency(currency);
    };
    fetchCurrency();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setSelectedCurrency(newCurrency);
    await setPreferredCurrency(newCurrency);
    router.refresh();
  };

  return (
    <div className="flex items-center mt-2 w-full">
      <select
        value={selectedCurrency}
        onChange={handleChange}
        className="text-14 bg-gray-100 border border-gray-300 text-gray-700 rounded-md py-1.5 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {currencies.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.code} - {curr.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;
