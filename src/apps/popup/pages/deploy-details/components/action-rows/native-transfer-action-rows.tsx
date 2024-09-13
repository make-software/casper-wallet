import React from 'react';

import { ContainerWithAmount } from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NativeTransferActionRowsProps {
  amount: string;
  publicKey: string;
  fiatAmount: string;
  isReceive: boolean;
  title: string;
  accountName?: string;
}

export const NativeTransferActionRows = ({
  amount,
  publicKey,
  fiatAmount,
  isReceive,
  title,
  accountName
}: NativeTransferActionRowsProps) => (
  <ContainerWithAmount title={title} amount={amount} fiatAmount={fiatAmount}>
    <AccountInfoRow
      publicKey={publicKey}
      label={isReceive ? 'from' : 'to'}
      accountName={accountName}
      isAction
      iconSize={20}
    />
  </ContainerWithAmount>
);
