import { ICasperMarketDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { CsprMarketDeployEntryPoint } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AmountRow,
  ContractInfoRow,
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';
import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface CsprMarketActionRowsProps {
  deploy: ICasperMarketDeploy;
}

export const CsprMarketActionRows = ({ deploy }: CsprMarketActionRowsProps) => {
  const {
    entryPoint,
    contractName,
    contractPackageHash,
    collectionHash,
    nftTokenIds,
    offererAccountInfo
  } = deploy;
  const isDelist = entryPoint === CsprMarketDeployEntryPoint.delist_token;
  const isListAction =
    entryPoint === CsprMarketDeployEntryPoint.delist_token ||
    entryPoint === CsprMarketDeployEntryPoint.list_token;
  const isOfferAction =
    entryPoint === CsprMarketDeployEntryPoint.accept_offer ||
    entryPoint === CsprMarketDeployEntryPoint.make_offer ||
    entryPoint === CsprMarketDeployEntryPoint.cancel_offer;

  const title = getEntryPointName(deploy, true);

  if (isListAction) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          nftTokenIds={nftTokenIds}
          contractPackageHash={contractPackageHash}
          collectionHash={collectionHash}
        />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          label={isDelist ? 'from' : 'on'}
        />
      </SimpleContainer>
    );
  }

  if (isOfferAction) {
    return (
      <SimpleContainer title={title}>
        {Number(deploy.formattedDecimalAmount) ? (
          <AmountRow
            label="of"
            amount={deploy.formattedDecimalAmount}
            symbol="CSPR"
            fiatAmount={deploy.fiatAmount}
          />
        ) : null}
        <NftInfoRow
          nftTokenIds={nftTokenIds}
          imgLogo={offererAccountInfo?.brandingLogo}
          contractName={offererAccountInfo?.name}
          contractPackageHash={contractPackageHash}
          collectionHash={collectionHash}
          label="for"
        />
        <AccountInfoRow
          publicKey={deploy.offererHash}
          label="from"
          isAction
          iconSize={20}
          csprName={offererAccountInfo?.csprName}
          imgLogo={offererAccountInfo?.brandingLogo}
        />
        <ContractInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          label="on"
        />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      title={title}
      contractPackageHash={contractPackageHash}
      contractName={contractName}
    />
  );
};
