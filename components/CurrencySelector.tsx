"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getPreferredCurrency, setPreferredCurrency } from "@/lib/actions/currency.actions";
import { CURRENCY_CHANGED_EVENT } from "@/hooks/useCurrency";

const currencies = [
  { code: "USD", label: "US Dollar" },
  { code: "TRY", label: "Turkish Lira" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "CAD", label: "Canadian Dollar" },
];

const CurrencySelector = () => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const router = useRouter();

  useEffect(() => {
    const fetchCurrency = async () => {
      const currency = await getPreferredCurrency();
      setSelectedCurrency(currency);
    };

    fetchCurrency();

    const handleCurrencyChange = (event: Event) => {
      const nextCurrency = (event as CustomEvent<string>).detail;
      if (nextCurrency) setSelectedCurrency(nextCurrency);
    };

    window.addEventListener(CURRENCY_CHANGED_EVENT, handleCurrencyChange);
    return () => {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, handleCurrencyChange);
    };
  }, []);

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = event.target.value;
    setSelectedCurrency(newCurrency);
    window.dispatchEvent(
      new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: newCurrency })
    );
    await setPreferredCurrency(newCurrency);
    router.refresh();
  };

  return (
    <div className="flex w-full items-center">
      <select
        value={selectedCurrency}
        onChange={handleChange}
        className="w-full cursor-pointer rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-14 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;
