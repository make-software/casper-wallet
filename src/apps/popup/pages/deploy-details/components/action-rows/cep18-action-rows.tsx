import React from 'react';

import {
  Cep18EntryPoint,
  Cep18EntryPointNameMap,
  DeployIcon
} from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AccountInfoRow,
  AmountRow,
  ContractInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

interface Cep18ActionRowsProps {
  entryPointName: string;
  amount: string;
  symbol: string;
  iconUrl?: string;
  contractLink: string;
  contractName: string;
  publicKey: string;
}

export const Cep18ActionRows = ({
  entryPointName,
  amount,
  symbol,
  iconUrl = DeployIcon.Generic,
  contractLink,
  contractName,
  publicKey
}: Cep18ActionRowsProps) => {
  const isTransfer = entryPointName === Cep18EntryPoint.transfer;
  const isMint = entryPointName === Cep18EntryPoint.mint;
  const isBurn = entryPointName === Cep18EntryPoint.burn;
  const isApprove = entryPointName === Cep18EntryPoint.approve;

  if (isTransfer || isMint) {
    return (
      <SimpleContainer entryPointName={Cep18EntryPointNameMap[entryPointName]}>
        <AmountRow amount={amount} symbol={symbol} label="of" />
        <ContractInfoRow
          contractLink={contractLink}
          contractName={contractName}
          iconUrl={iconUrl || DeployIcon.Cep18Default}
        />
        <AccountInfoRow publicKey={publicKey} label="to" />
      </SimpleContainer>
    );
  }

  if (isApprove) {
    return (
      <SimpleContainer entryPointName={Cep18EntryPointNameMap[entryPointName]}>
        <AmountRow amount={amount} symbol={symbol} label="for" />
        <ContractInfoRow
          contractLink={contractLink}
          contractName={contractName}
          iconUrl={iconUrl || DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow publicKey={publicKey} label="to" />
      </SimpleContainer>
    );
  }

  if (isBurn) {
    return (
      <SimpleContainer entryPointName={Cep18EntryPointNameMap[entryPointName]}>
        <AmountRow amount={amount} symbol={symbol} label="of" />
        <ContractInfoRow
          contractLink={contractLink}
          contractName={contractName}
          iconUrl={iconUrl || DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow publicKey={publicKey} label="owned by" />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      entryPointName={entryPointName}
      contractLink={contractLink}
      contractName={contractName}
      additionalInfo="CEP-18 Token"
    />
  );
};
