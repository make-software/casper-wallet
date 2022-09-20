import React from 'react';

import { formatNumber, formatTimestamp } from '@libs/ui/utils/formatters';
import {
  CSPR,
  Hash,
  HashVariant,
  PrecisionCase,
  Typography
} from '@src/libs/ui';

import { capitalizeString } from '@src/utils/helpers';

import {
  isKeyOfHashValue,
  isKeyOfIdValue,
  isKeyOfPriceValue,
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

  if (isKeyOfPriceValue(id)) {
    return (
      <Typography type="body" weight="regular">
        <CSPR motes={value} precisionCase={PrecisionCase.full} />
      </Typography>
    );
  }

  if (isKeyOfIdValue(id)) {
    return (
      <Hash
        value={formatNumber(value)}
        variant={HashVariant.BodyHash}
        color="contentPrimary"
      />
    );
  }

  if (isKeyOfTimestampValue(id)) {
    return (
      <Typography type="body" weight="regular">
        {formatTimestamp(value)}
      </Typography>
    );
  }

  return (
    <Typography type="body" weight="regular">
      {capitalizeString(value)}
    </Typography>
  );
}
