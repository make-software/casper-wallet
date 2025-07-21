import { ICasperMarketDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { CsprMarketDeployEntryPoint } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AmountRow,
  ContractInfoRow,
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface CsprMarketActionRowsProps {
  title: string;
  entryPoint: ICasperMarketDeploy['entryPoint'];
  contractName: ICasperMarketDeploy['contractName'];
  contractPackageHash: ICasperMarketDeploy['contractPackageHash'];
  contractHash: ICasperMarketDeploy['contractHash'];
  collectionHash: ICasperMarketDeploy['collectionHash'];
  nftTokenIds: ICasperMarketDeploy['nftTokenIds'];
  nftTokenUrlsMap: ICasperMarketDeploy['nftTokenUrlsMap'];
  offererAccountInfo: ICasperMarketDeploy['offererAccountInfo'];
  formattedDecimalAmount: ICasperMarketDeploy['formattedDecimalAmount'];
  fiatAmount: ICasperMarketDeploy['fiatAmount'];
  offererHash: ICasperMarketDeploy['offererHash'];
  contractLink?: Maybe<string>;
  collectionName?: Maybe<string>;
}

export const CsprMarketActionRows = ({
  title,
  entryPoint,
  contractName,
  contractPackageHash,
  contractHash,
  collectionHash,
  nftTokenIds,
  nftTokenUrlsMap,
  offererAccountInfo,
  formattedDecimalAmount,
  fiatAmount,
  offererHash,
  contractLink,
  collectionName
}: CsprMarketActionRowsProps) => {
  const isDelist = entryPoint === CsprMarketDeployEntryPoint.delist_token;
  const isListAction =
    entryPoint === CsprMarketDeployEntryPoint.delist_token ||
    entryPoint === CsprMarketDeployEntryPoint.list_token;
  const isOfferAction =
    entryPoint === CsprMarketDeployEntryPoint.accept_offer ||
    entryPoint === CsprMarketDeployEntryPoint.make_offer ||
    entryPoint === CsprMarketDeployEntryPoint.cancel_offer;

  if (isListAction) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionName={collectionName}
          collectionHash={collectionHash}
          contractLink={contractLink}
        />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          label={isDelist ? 'from' : 'on'}
          contractLink={contractLink}
        />
      </SimpleContainer>
    );
  }

  if (isOfferAction) {
    return (
      <SimpleContainer title={title}>
        {Number(formattedDecimalAmount) ? (
          <AmountRow
            label="of"
            amount={formattedDecimalAmount}
            symbol="CSPR"
            fiatAmount={fiatAmount}
          />
        ) : null}
        <NftInfoRow
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          imgLogo={offererAccountInfo?.brandingLogo}
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionHash={collectionHash}
          collectionName={collectionName}
          label="for"
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={offererHash}
          label="from"
          isAction
          iconSize={20}
          csprName={offererAccountInfo?.csprName}
          imgLogo={offererAccountInfo?.brandingLogo}
          accountLink={offererAccountInfo?.explorerLink}
        />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          label="on"
          contractLink={contractLink}
        />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      title={title}
      contractPackageHash={contractPackageHash}
      contractName={contractName}
      contractLink={contractLink}
    />
  );
};
