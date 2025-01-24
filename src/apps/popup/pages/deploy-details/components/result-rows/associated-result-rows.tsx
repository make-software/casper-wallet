import { IAssociatedKeysDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface AssociatedResultRowsProps {
  deploy: IAssociatedKeysDeploy;
}

export const AssociatedResultRows = ({ deploy }: AssociatedResultRowsProps) => {
  const { callerPublicKey, callerAccountInfo } = deploy;
  return (
    <SimpleContainer title={'Updated account'}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <AccountInfoRow
          publicKey={callerPublicKey}
          isAction
          iconSize={20}
          csprName={callerAccountInfo?.csprName}
          imgLogo={callerAccountInfo?.brandingLogo}
          accountName={callerAccountInfo?.name}
        />
      </AlignedFlexRow>
    </SimpleContainer>
  );
};
