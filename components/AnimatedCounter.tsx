'use client';

import CountUp from 'react-countup';
import { useCurrency } from '@/hooks/useCurrency';
import { convertAmount, formatAmount } from '@/lib/utilsz';

const AnimatedCounter = ({ amount }: { amount: number }) => {
  const currency = useCurrency();
  const converted = convertAmount(amount, 'USD', currency);

  return (
    <div className="w-full">
      <CountUp
        decimals={2}
        end={converted}
        formattingFn={(value) => formatAmount(value, currency)}
      />
    </div>
  );
};

export default AnimatedCounter;
