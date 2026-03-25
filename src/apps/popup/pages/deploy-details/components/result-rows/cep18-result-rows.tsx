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

import { useFetchContractPackage } from '@libs/services/contract-package';
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
    recipientAccountInfo,
    callerAccountInfo,
    callerKeyType,
    symbol,
    recipientKey,
    recipientKeyType,
    callerPublicKey,
    contractName,
    iconUrl
  } = action;
  const isTransfer = entryPoint === Cep18DeployEntryPoint.transfer;
  const isMint = entryPoint === Cep18DeployEntryPoint.mint;
  const isBurn = entryPoint === Cep18DeployEntryPoint.burn;
  const isApprove = entryPoint === Cep18DeployEntryPoint.approve;

  const title = DeployResultEntryPointNameMap[action.entryPoint];

  const { contractPackage: callerContractPackage } = useFetchContractPackage(
    callerKeyType === 'contractHash' ? callerPublicKey : null
  );

  const { contractPackage: recipientContractPackage } = useFetchContractPackage(
    recipientKeyType === 'contractHash' ? recipientKey : null
  );

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
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="to"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            label="to"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
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
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="owned by"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            label="owned by"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
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
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="to"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            label="to"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
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
        {callerKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="from"
            contractPackageHash={callerPublicKey}
            contractName={callerContractPackage?.name || ''}
            iconUrl={callerContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={callerPublicKey}
            label="from"
            isAction
            iconSize={20}
            csprName={callerAccountInfo?.csprName}
            imgLogo={callerAccountInfo?.brandingLogo}
          />
        )}
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="to"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            label="to"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
      </SimpleContainer>
    );
  }

  return null;
};
