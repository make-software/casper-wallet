import React from 'react';

import { formatMotes } from '@libs/ui/utils/formatters';
import { Hash, HashVariant, Typography } from '@src/libs/ui';

import { isKeyOfHashValue, isKeyOfPriceValue } from './types';

export function SignatureRequestValue({
  id,
  value
}: {
  id: string;
  value: string;
}) {
  if (isKeyOfHashValue(id)) {
    return (
      <Hash
        value={value}
        variant={HashVariant.BodyHash}
        color="contentPrimary"
        truncated
      />
    );
  }

  if (isKeyOfPriceValue(id)) {
    return (
      <Hash
        value={formatMotes(value)}
        variant={HashVariant.BodyHash}
        color="contentPrimary"
      />
    );
  }

  return <Typography type="body">{value}</Typography>;
}
