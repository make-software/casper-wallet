import { ICep18Deploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { Cep18DeployEntryPoint, DeployIcon } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AmountRow,
  ContractInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';
import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface Cep18ActionRowsProps {
  deploy: ICep18Deploy;
}

export const Cep18ActionRows = ({ deploy }: Cep18ActionRowsProps) => {
  const {
    entryPoint,
    recipientKey,
    contractPackageHash,
    contractName,
    formattedDecimalAmount,
    recipientAccountInfo,
    symbol,
    iconUrl
  } = deploy;
  const isTransfer = entryPoint === Cep18DeployEntryPoint.transfer;
  const isMint = entryPoint === Cep18DeployEntryPoint.mint;
  const isBurn = entryPoint === Cep18DeployEntryPoint.burn;
  const isApprove = entryPoint === Cep18DeployEntryPoint.approve;

  const title = getEntryPointName(deploy, true);

  if (isTransfer || isMint) {
    return (
      <SimpleContainer title={title}>
        <AmountRow amount={formattedDecimalAmount} symbol={symbol} label="of" />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          iconUrl={iconUrl}
          defaultSvg={DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
        />
      </SimpleContainer>
    );
  }

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
          defaultSvg={DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
        />
      </SimpleContainer>
    );
  }

  if (isBurn) {
    return (
      <SimpleContainer title={title}>
        <AmountRow amount={formattedDecimalAmount} symbol={symbol} label="of" />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          iconUrl={iconUrl}
          defaultSvg={DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="owned by"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
        />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      title={title}
      contractPackageHash={contractPackageHash}
      contractName={contractName}
      iconUrl={iconUrl || DeployIcon.Cep18Default}
      additionalInfo="CEP-18 Token"
    />
  );
};
