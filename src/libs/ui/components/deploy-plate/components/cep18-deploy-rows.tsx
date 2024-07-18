import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  Cep18EntryPoint,
  Cep18EntryPointNameMap,
  DeployIcon
} from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import {
  Avatar,
  Hash,
  HashVariant,
  Link,
  Typography
} from '@libs/ui/components';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface Erc20DeployRowsProps {
  amount: string;
  symbol: string;
  publicKey: string;
  tokenName: string;
  contractLink: string;
  entryPointName: Cep18EntryPoint;
  timestamp: string;
}

export const Cep18DeployRows = ({
  amount,
  symbol,
  publicKey,
  tokenName,
  contractLink,
  entryPointName,
  timestamp
}: Erc20DeployRowsProps) => {
  const { t } = useTranslation();

  const isTransfer = entryPointName === Cep18EntryPoint.transfer;

  return (
    <DeployContainer
      timestamp={timestamp}
      iconUrl={'icon from deploy' || DeployIcon.Generic}
      title={Cep18EntryPointNameMap[entryPointName]}
    >
      <AlignedFlexRow gap={SpacingSize.Tiny}>
        <Typography type="captionHash">{amount}</Typography>
        <Typography type="captionHash" color="contentSecondary">
          {symbol}
        </Typography>
      </AlignedFlexRow>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Link color="contentAction" href={contractLink}>
          <Typography type="captionRegular">{tokenName}</Typography>
        </Link>
        {isTransfer && (
          <>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>to</Trans>
            </Typography>
            <AlignedFlexRow gap={SpacingSize.Tiny}>
              <Avatar publicKey={publicKey} size={16} />
              <Hash
                value={publicKey}
                variant={HashVariant.CaptionHash}
                truncated
                truncatedSize="small"
                color="contentPrimary"
              />
            </AlignedFlexRow>
          </>
        )}
      </AlignedFlexRow>
    </DeployContainer>
  );
};
