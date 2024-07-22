import React from 'react';

import {
  AccountInfoRow,
  ContainerWithAmount
} from '@popup/pages/deploy-details/components/common';

interface NativeTransferResultRowsProps {
  amount: string;
  toPublicKey: string;
  fromPublicKey: string;
  fiatAmount: string;
}

export const NativeTransferResultRows = ({
  amount,
  toPublicKey,
  fromPublicKey,
  fiatAmount
}: NativeTransferResultRowsProps) => (
  <ContainerWithAmount
    entryPointName={'Transferred'}
    amount={amount}
    fiatAmount={fiatAmount}
  >
    <AccountInfoRow publicKey={toPublicKey} label={'to'} />
    <AccountInfoRow publicKey={fromPublicKey} label={'from'} />
  </ContainerWithAmount>
);
