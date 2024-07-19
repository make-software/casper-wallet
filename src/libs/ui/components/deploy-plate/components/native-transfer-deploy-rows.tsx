import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DeployIcon } from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Avatar, Hash, HashVariant, Typography } from '@libs/ui/components';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface NativeTransferDeployRowsProps {
  publicKey: string;
  amount: string;
  isTransactionIn: boolean;
  timestamp: string;
}

export const NativeTransferDeployRows = ({
  publicKey,
  amount,
  isTransactionIn,
  timestamp
}: NativeTransferDeployRowsProps) => {
  const { t } = useTranslation();

  return (
    <DeployContainer
      timestamp={timestamp}
      iconUrl={DeployIcon.NativeTransfer}
      title="Transfer"
    >
      <AlignedFlexRow gap={SpacingSize.Tiny}>
        <Typography type="captionHash">{amount}</Typography>
        <Typography type="captionHash" color="contentSecondary">
          CSPR
        </Typography>
      </AlignedFlexRow>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{isTransactionIn ? 'from' : 'to'}</Trans>
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
      </AlignedFlexRow>
    </DeployContainer>
  );
};
