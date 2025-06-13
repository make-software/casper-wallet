import { INativeCsprDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { ContainerWithAmount } from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NativeTransferActionRowsProps {
  title: string;
  formattedDecimalAmount: INativeCsprDeploy['formattedDecimalAmount'];
  fiatAmount: INativeCsprDeploy['fiatAmount'];
  isReceive: INativeCsprDeploy['isReceive'];
  callerPublicKey: INativeCsprDeploy['callerPublicKey'];
  recipientKey: INativeCsprDeploy['recipientKey'];
  callerAccountInfo: INativeCsprDeploy['callerAccountInfo'];
  recipientAccountInfo: INativeCsprDeploy['recipientAccountInfo'];
}

export const NativeTransferActionRows = ({
  title,
  formattedDecimalAmount,
  fiatAmount,
  isReceive,
  callerPublicKey,
  recipientKey,
  callerAccountInfo,
  recipientAccountInfo
}: NativeTransferActionRowsProps) => {
  return (
    <ContainerWithAmount
      title={title}
      amount={formattedDecimalAmount}
      fiatAmount={fiatAmount}
    >
      <AccountInfoRow
        publicKey={isReceive ? callerPublicKey : recipientKey}
        label={isReceive ? 'from' : 'to'}
        accountName={
          isReceive ? callerAccountInfo?.name : recipientAccountInfo?.name
        }
        isAction
        iconSize={20}
        imgLogo={
          isReceive
            ? callerAccountInfo?.brandingLogo
            : recipientAccountInfo?.brandingLogo
        }
        csprName={
          isReceive
            ? callerAccountInfo?.csprName
            : recipientAccountInfo?.csprName
        }
        accountLink={
          isReceive
            ? callerAccountInfo?.explorerLink
            : recipientAccountInfo?.explorerLink
        }
      />
    </ContainerWithAmount>
  );
};
