import { getCasperNetworkByChainName } from 'casper-wallet-core';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Hash, HashVariant, SvgIcon, Typography } from '@libs/ui/components';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { Color, capitalizeString, formatDate } from '@libs/ui/utils';

import {
  ISignatureRequestRecordFeeValue,
  ISignatureRequestRecordSenderValue,
  TxCommonDetailsKeys
} from './signature-request-content';
import { mapTxKeyToLabel } from './utils';

export const NetworkIconColor: Record<CasperNetwork, Color> = {
  mainnet: 'contentLightRed',
  testnet: 'contentLightBlue',
  devnet: 'contentWarning',
  integration: 'contentPositive'
};

interface ISignatureRequestValueProps {
  id: TxCommonDetailsKeys;
  value:
    | string
    | ISignatureRequestRecordFeeValue
    | ISignatureRequestRecordSenderValue;
}

export function SignatureRequestValue({
  id,
  value
}: ISignatureRequestValueProps) {
  const { t } = useTranslation();

  if (id === 'txHash' && typeof value === 'string') {
    return (
      <Hash
        value={value}
        label={t(mapTxKeyToLabel[id])}
        variant={HashVariant.BodyHash}
        color="contentAction"
        truncated
        placement="bottomLeft"
        withCopyIcon
        withCopiedIcon
      />
    );
  }

  if (id === 'sender' && value && typeof value === 'object') {
    const { key, accountInfo } = (value ??
      {}) as ISignatureRequestRecordSenderValue;

    return (
      <AccountInfoRow
        publicKey={key}
        isAction
        iconSize={20}
        csprName={accountInfo?.csprName ?? null}
        imgLogo={accountInfo?.brandingLogo}
        accountName={accountInfo?.name}
        accountLink={accountInfo?.explorerLink ?? undefined}
        withCopyIcon
      />
    );
  }

  if (id === 'network' && typeof value === 'string') {
    const network = getCasperNetworkByChainName(value);

    return (
      <AlignedFlexRow gap={SpacingSize.Small}>
        {network && (
          <SvgIcon
            src="assets/icons/network.svg"
            size={20}
            color={NetworkIconColor[network]}
          />
        )}
        <Typography type="captionRegular" color={'contentPrimary'}>
          {capitalizeString(network ?? value)}
        </Typography>
      </AlignedFlexRow>
    );
  }

  if (id === 'fee' && typeof value === 'object') {
    const { feeValue, feeSuffix } = (value ??
      {}) as ISignatureRequestRecordFeeValue;

    return (
      <span style={{ wordBreak: 'break-word', textAlign: 'right' }}>
        <Typography type="bodyHash" color="contentPrimary" textAlign="right">
          {feeValue}
        </Typography>
        <Typography type="bodyHash" color="contentSecondary" textAlign="right">
          {feeSuffix}
        </Typography>
      </span>
    );
  }

  if (id === 'expires' && typeof value === 'string') {
    return <Typography type="captionRegular">{formatDate(value)}</Typography>;
  }

  if (!value) {
    return null;
  }

  return (
    <Typography
      type="bodyHash"
      color="contentPrimary"
      style={{ overflowWrap: 'anywhere' }}
    >
      {value}
    </Typography>
  );
}
