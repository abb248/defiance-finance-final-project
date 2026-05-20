'use client';

import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { formatAmount, convertAmount } from '@/lib/utilsz';

interface FormattedAmountProps {
  amount: number;
}

export const FormattedAmount: React.FC<FormattedAmountProps> = ({ amount }) => {
  const currency = useCurrency();
  const converted = convertAmount(amount, 'USD', currency);
  
  return <>{formatAmount(converted, currency)}</>;
};
