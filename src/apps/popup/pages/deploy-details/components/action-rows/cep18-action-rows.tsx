import { ICep18Deploy } from 'casper-wallet-core/src/domain/deploys/entities';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { Cep18DeployEntryPoint, DeployIcon } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AmountRow,
  ContractInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface Cep18ActionRowsProps {
  title: string;
  entryPoint: ICep18Deploy['entryPoint'];
  recipientKey: ICep18Deploy['recipientKey'];
  contractPackageHash: ICep18Deploy['contractPackageHash'];
  contractName: ICep18Deploy['contractName'];
  formattedDecimalAmount: ICep18Deploy['formattedDecimalAmount'];
  recipientAccountInfo: ICep18Deploy['recipientAccountInfo'];
  symbol: ICep18Deploy['symbol'];
  iconUrl: ICep18Deploy['iconUrl'];
  contractLink?: Maybe<string>;
}

export const Cep18ActionRows = ({
  title,
  entryPoint,
  recipientKey,
  contractPackageHash,
  contractName,
  formattedDecimalAmount,
  recipientAccountInfo,
  symbol,
  iconUrl,
  contractLink
}: Cep18ActionRowsProps) => {
  const isTransfer = entryPoint === Cep18DeployEntryPoint.transfer;
  const isMint = entryPoint === Cep18DeployEntryPoint.mint;
  const isBurn = entryPoint === Cep18DeployEntryPoint.burn;
  const isApprove = entryPoint === Cep18DeployEntryPoint.approve;

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
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
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
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
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
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="owned by"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
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
      contractLink={contractLink}
    />
  );
};
