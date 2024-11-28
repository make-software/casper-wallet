import { CLValue } from 'casper-js-sdk';
import { formatNumber } from 'casper-wallet-core';
import React from 'react';

import { Hash, HashVariant, Typography } from '@libs/ui/components';
import { formatDate, motesToCSPR } from '@libs/ui/utils';

import {
  getDeployParsedValue,
  isDeployArgValueHash,
  isDeployArgValueNumber,
  isKeyOfCurrencyValue,
  isKeyOfHashValue,
  isKeyOfTimestampValue
} from './deploy-utils';

export function DeployValue({
  id,
  value,
  isContractCall,
  showSimpleAmount
}: {
  id: string;
  value: string | CLValue;
  isContractCall?: boolean;
  showSimpleAmount?: boolean;
}) {
  if (typeof value === 'string') {
    // string args
    if (isKeyOfHashValue(id)) {
      return (
        <Hash
          value={value}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
          truncated
          placement="bottomLeft"
        />
      );
    }

    if (isKeyOfCurrencyValue(id)) {
      if (isContractCall && id === 'amount' && showSimpleAmount) {
        return <Typography type="bodyHash">{formatNumber(value)}</Typography>;
      }

      const cspr = `${formatNumber(motesToCSPR(value), {
        precision: { max: 5 }
      })} CSPR`;

      return (
        <Typography type="bodyHash" color="contentPrimary">
          {cspr}
        </Typography>
      );
    }

    if (isKeyOfTimestampValue(id)) {
      return <Typography type="body">{formatDate(value)}</Typography>;
    }

    return (
      // Temporary solution. We will change it when we have the new design
      <Typography type="body" style={{ overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    );
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
          placement="bottomLeft"
        />
      );
    }

    if (isDeployArgValueNumber(value)) {
      if (isContractCall && id === 'amount' && showSimpleAmount) {
        return (
          <Typography type="bodyHash">{formatNumber(parsedValue)}</Typography>
        );
      }

      const numbers = isKeyOfCurrencyValue(id)
        ? `${formatNumber(motesToCSPR(parsedValue), {
            precision: { max: 5 }
          })} CSPR`
        : formatNumber(parsedValue);

      return (
        <Typography type="bodyHash" color="contentPrimary">
          {numbers}
        </Typography>
      );
    }

    return (
      // Temporary solution. We will change it when we have the new design
      <Typography type="body" style={{ overflowWrap: 'anywhere' }}>
        {parsedValue}
      </Typography>
    );
  }
}
