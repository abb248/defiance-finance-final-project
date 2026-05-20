'use client';

import CountUp from 'react-countup';
import { useCurrency } from '@/hooks/useCurrency';
import { convertAmount } from '@/lib/utilsz';

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    USD: "$",
    TRY: "₺",
    EUR: "€",
    GBP: "£",
    CAD: "$"
  };
  return symbols[currency] || "$";
};

const AnimatedCounter = ({ amount }: { amount: number }) => {
  const currency = useCurrency();
  const converted = convertAmount(amount, 'USD', currency);
  
  return (
    <div className="w-full">
      <CountUp 
        decimals={2}
        decimal=","
        prefix={getCurrencySymbol(currency)}
        end={converted} 
      />
    </div>
  )
}

export default AnimatedCounter
//commitlemek için ekledim