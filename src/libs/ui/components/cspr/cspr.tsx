import React from 'react';

import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';
import { Hash, HashVariant } from '@libs/ui';

export enum PrecisionCase {
  'deployCost' = 'deployCost',
  'full' = 'full'
}

export const csprPrecisionByCase = (precisionCase?: PrecisionCase) => {
  switch (precisionCase) {
    case PrecisionCase.deployCost:
      return 5;

    case PrecisionCase.full:
      return 9;

    default:
      return 0;
  }
};

export interface CSPRProps {
  motes?: string | null;
  precisionCase?: PrecisionCase;
}

export function CSPR({ motes, precisionCase }: CSPRProps) {
  const precision = csprPrecisionByCase(precisionCase);

  if (motes == null) {
    return <>{'N/A'}</>;
  }

  const csprAmount = motesToCSPR(motes);
  const formattedCsprAmount = formatNumber(csprAmount, { precision });
  const formattedText = `${formattedCsprAmount} CSPR`;

  return (
    <Hash
      value={formattedText}
      variant={HashVariant.BodyHash}
      color="contentPrimary"
    />
  );
}
