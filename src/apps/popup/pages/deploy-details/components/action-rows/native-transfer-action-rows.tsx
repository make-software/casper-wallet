import React from 'react';

import {
  AccountInfoRow,
  ContainerWithAmount
} from '@popup/pages/deploy-details/components/common';

interface NativeTransferActionRowsProps {
  amount: string;
  publicKey: string;
  fiatAmount: string;
}

export const NativeTransferActionRows = ({
  amount,
  publicKey,
  fiatAmount
}: NativeTransferActionRowsProps) => (
  <ContainerWithAmount
    entryPointName={'Transfer'}
    amount={amount}
    fiatAmount={fiatAmount}
  >
    <AccountInfoRow publicKey={publicKey} label="to" />
  </ContainerWithAmount>
);
