import React from 'react';

import {
  capitalizeString,
  formatNumber,
  formatTimestamp
} from '@libs/ui/utils/formatters';
import { Hash, HashVariant, Typography } from '@src/libs/ui';

import {
  isKeyOfHashValue,
  isKeyOfCurrencyValue,
  isKeyOfTimestampValue
} from './types';

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

  if (isKeyOfCurrencyValue(id)) {
    return (
      <Hash
        value={formatNumber(value)}
        variant={HashVariant.BodyHash}
        color="contentPrimary"
      />
    );
  }

  if (isKeyOfTimestampValue(id)) {
    return <Typography type="body">{formatTimestamp(value)}</Typography>;
  }

  return <Typography type="body">{capitalizeString(value)}</Typography>;
}
