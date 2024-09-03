import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { ContainerWithAmount } from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NativeTransferResultRowsProps {
  amount: string;
  toPublicKey: string;
  fromPublicKey: string;
  fiatAmount: string;
  callerAccountInfo: Maybe<IAccountInfo>;
  recipientAccountInfo: Maybe<IAccountInfo>;
}

export const NativeTransferResultRows = ({
  amount,
  toPublicKey,
  fromPublicKey,
  fiatAmount,
  callerAccountInfo,
  recipientAccountInfo
}: NativeTransferResultRowsProps) => (
  <ContainerWithAmount
    title={'Transferred'}
    amount={amount}
    fiatAmount={fiatAmount}
  >
    <AccountInfoRow
      publicKey={fromPublicKey}
      accountName={callerAccountInfo?.name}
      label={'from'}
      isAction
      iconSize={20}
    />
    <AccountInfoRow
      publicKey={toPublicKey}
      accountName={recipientAccountInfo?.name}
      label={'to'}
      isAction
      iconSize={20}
    />
  </ContainerWithAmount>
);
