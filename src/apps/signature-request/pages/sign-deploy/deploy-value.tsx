import React from 'react';
import { CLValue } from 'casper-js-sdk';

import { formatNumber, formatTimestamp } from '@libs/ui/utils/formatters';
import { Hash, HashVariant, Typography } from '@src/libs/ui';

import {
  isDeployArgValueHash,
  isDeployArgValueNumber,
  isKeyOfHashValue,
  isKeyOfCurrencyValue,
  isKeyOfTimestampValue,
  getDeployParsedValue
} from './deploy-utils';

export function DeployValue({
  id,
  value
}: {
  id: string;
  value: string | CLValue;
}) {
  if (typeof value === 'string' || typeof value === 'number') {
    // string args
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
          value={formatNumber(Number(value))}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
        />
      );
    }

    if (isKeyOfTimestampValue(id)) {
      return <Typography type="body">{formatTimestamp(value)}</Typography>;
    }

    return <Typography type="body">{value}</Typography>;
  } else {
    // cl value args
    const { parsedValue } = getDeployParsedValue(value);

    if (isDeployArgValueHash(value)) {
      return (
        <Hash
          value={parsedValue}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
          truncated
        />
      );
    }

    if (isDeployArgValueNumber(value)) {
      return (
        <Hash
          value={formatNumber(Number(parsedValue))}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
        />
      );
    }

    return <Typography type="body">{parsedValue}</Typography>;
  }
}
