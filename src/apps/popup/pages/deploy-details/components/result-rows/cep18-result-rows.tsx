import { ICep18ActionsResult } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import {
  Cep18DeployEntryPoint,
  DeployIcon,
  DeployResultEntryPointNameMap
} from '@src/constants';

import {
  AmountRow,
  ContractInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface Cep18ResultRowsProps {
  action: ICep18ActionsResult;
  contractPackageHash: string;
}

export const Cep18ResultRows = ({
  action,
  contractPackageHash
}: Cep18ResultRowsProps) => {
  const {
    entryPoint,
    formattedDecimalAmount,
    symbol,
    recipientKey,
    callerPublicKey,
    contractName,
    iconUrl
  } = action;
  const isTransfer = entryPoint === Cep18DeployEntryPoint.transfer;
  const isMint = entryPoint === Cep18DeployEntryPoint.mint;
  const isBurn = entryPoint === Cep18DeployEntryPoint.burn;
  const isApprove = entryPoint === Cep18DeployEntryPoint.approve;

  const title = DeployResultEntryPointNameMap[action.entryPoint];

  if (isApprove) {
    return (
      <SimpleContainer title={title}>
        <AmountRow
          amount={formattedDecimalAmount}
          symbol={symbol}
          label="for"
        />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          iconUrl={iconUrl}
          additionalInfo="token(s)"
          defaultSvg={DeployIcon.Cep18Default}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  if (isBurn) {
    return (
      <SimpleContainer title={title}>
        <AmountRow amount={formattedDecimalAmount} symbol={symbol} />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          iconUrl={iconUrl}
          additionalInfo="token(s)"
          defaultSvg={DeployIcon.Cep18Default}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="owned by"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  if (isMint) {
    return (
      <SimpleContainer title={title}>
        <AmountRow amount={formattedDecimalAmount} symbol={symbol} />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          iconUrl={iconUrl}
          additionalInfo="token(s)"
          defaultSvg={DeployIcon.Cep18Default}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  if (isTransfer) {
    return (
      <SimpleContainer title={title}>
        <AmountRow amount={formattedDecimalAmount} symbol={symbol} />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          iconUrl={iconUrl}
          additionalInfo="token(s)"
          defaultSvg={DeployIcon.Cep18Default}
        />
        <AccountInfoRow
          publicKey={callerPublicKey}
          label="from"
          isAction
          iconSize={20}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  return null;
};
