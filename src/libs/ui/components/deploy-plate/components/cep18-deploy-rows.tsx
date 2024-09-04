import { ICep18Deploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { Cep18DeployEntryPoint, DeployIcon } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface Erc20DeployRowsProps {
  deploy: ICep18Deploy;
}

export const Cep18DeployRows = ({ deploy }: Erc20DeployRowsProps) => {
  const { entryPoint } = deploy;
  const isTransfer = entryPoint === Cep18DeployEntryPoint.transfer;
  const title = getEntryPointName(deploy);

  return (
    <DeployContainer
      timestamp={deploy.timestamp}
      iconUrl={deploy.iconUrl || DeployIcon.Cep18Default}
      title={title}
      deployStatus={{
        status: deploy.status,
        errorMessage: deploy.errorMessage
      }}
    >
      <AlignedFlexRow gap={SpacingSize.Tiny}>
        <Typography type="captionHash">
          {deploy.formattedDecimalAmount}
        </Typography>
        <Typography type="captionHash" color="contentSecondary">
          {deploy.symbol}
        </Typography>
      </AlignedFlexRow>
      {isTransfer ? (
        <AccountInfoRow
          label="to"
          publicKey={deploy.recipientKey}
          accountName={
            deploy.isReceive
              ? deploy.callerAccountInfo?.name
              : deploy.recipientAccountInfo?.name
          }
        >
          <Typography type="captionRegular" color="contentPrimary">
            {deploy.contractName}
          </Typography>
        </AccountInfoRow>
      ) : (
        <AlignedFlexRow gap={SpacingSize.Small}>
          <Typography type="captionRegular" color="contentPrimary">
            {deploy.contractName}
          </Typography>
        </AlignedFlexRow>
      )}
    </DeployContainer>
  );
};
