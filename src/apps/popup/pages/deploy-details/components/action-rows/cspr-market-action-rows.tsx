import React from 'react';

import {
  CsprMarketEntryPoint,
  CsprMarketEntryPointNameMap,
  DeployIcon
} from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AccountInfoRow,
  AmountRow,
  ContractInfoRow,
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

interface CsprMarketActionRowsProps {
  entryPointName: string;
  nftIcon?: string;
  nftName: string;
  nftId: string;
  amount: string;
  fiatAmount: string;
  publicKey: string;
  csprMarketLink: string;
}

export const CsprMarketActionRows = ({
  entryPointName,
  nftIcon = DeployIcon.Generic,
  nftName,
  nftId,
  amount,
  csprMarketLink,
  fiatAmount,
  publicKey
}: CsprMarketActionRowsProps) => {
  const isDelist = entryPointName === CsprMarketEntryPoint.delist_token;
  const isListAction =
    entryPointName === CsprMarketEntryPoint.delist_token ||
    entryPointName === CsprMarketEntryPoint.list_token;
  const isOfferAction =
    entryPointName === CsprMarketEntryPoint.accept_offer ||
    entryPointName === CsprMarketEntryPoint.make_offer ||
    entryPointName === CsprMarketEntryPoint.cancel_offer;

  if (isListAction) {
    return (
      <SimpleContainer
        entryPointName={CsprMarketEntryPointNameMap[entryPointName]}
      >
        <NftInfoRow
          nftId={nftId}
          contractIcon={nftIcon}
          contractName={nftName}
        />
        <ContractInfoRow
          contractLink={csprMarketLink}
          contractName="CSPR.market"
          label={isDelist ? 'from' : 'on'}
          iconUrl={DeployIcon.CSPRMarket}
        />
      </SimpleContainer>
    );
  }

  if (isOfferAction) {
    return (
      <SimpleContainer
        entryPointName={CsprMarketEntryPointNameMap[entryPointName]}
      >
        <AmountRow
          label="of"
          amount={amount}
          symbol="CSPR"
          fiatAmount={fiatAmount}
        />
        <NftInfoRow
          nftId={nftId}
          contractIcon={nftIcon}
          contractName={nftName}
          label="for"
        />
        <AccountInfoRow publicKey={publicKey} label="from" />
        <ContractInfoRow
          contractLink={csprMarketLink}
          contractName="CSPR.market"
          iconUrl={DeployIcon.CSPRMarket}
          label="on"
        />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      entryPointName={entryPointName}
      contractLink={csprMarketLink}
      contractName="CSPR.market"
    />
  );
};
