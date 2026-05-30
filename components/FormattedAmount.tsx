'use client';

import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { formatAmount, convertAmount } from '@/lib/utilsz';

interface FormattedAmountProps {
  amount: number;
  sourceCurrency?: string | null;
}

export const FormattedAmount: React.FC<FormattedAmountProps> = ({
  amount,
  sourceCurrency = 'USD',
}) => {
  const currency = useCurrency();
  const converted = convertAmount(amount, sourceCurrency || 'USD', currency);
  
  return <>{formatAmount(converted, currency)}</>;
};
