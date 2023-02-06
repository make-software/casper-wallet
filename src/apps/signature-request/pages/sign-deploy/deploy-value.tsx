import React from 'react';

import { formatNumber, formatTimestamp } from '@libs/ui/utils/formatters';
import { Hash, HashVariant, Typography } from '@src/libs/ui';

import { CLValue } from 'casper-js-sdk';
import {
  isDeployArgValueHash,
  isDeployArgValueNumber,
  isKeyOfHashValue,
  isKeyOfCurrencyValue,
  isKeyOfTimestampValue,
  parseDeployArgValue
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
          value={formatNumber(value)}
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
    const parsedVal = parseDeployArgValue(value);
    const str = Array.isArray(parsedVal) ? parsedVal.join(', ') : parsedVal;

    if (isDeployArgValueHash(value)) {
      return (
        <Hash
          value={str}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
          truncated
        />
      );
    }

    if (isDeployArgValueNumber(value)) {
      return (
        <Hash
          value={formatNumber(str)}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
        />
      );
    }

    return <Typography type="body">{str}</Typography>;
  }
}
