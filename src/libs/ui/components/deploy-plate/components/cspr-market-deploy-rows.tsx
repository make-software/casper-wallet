import { ICasperMarketDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { CsprMarketDeployEntryPoint, DeployIcon } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import {
  ContractRow,
  NftAmount
} from '@libs/ui/components/deploy-plate/components/common';
import { DefaultDeployRows } from '@libs/ui/components/deploy-plate/components/default-deploy-rows';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface CSPRMarketDeployRowsProps {
  deploy: ICasperMarketDeploy;
}

export const CSPRMarketDeployRows = ({ deploy }: CSPRMarketDeployRowsProps) => {
  const { entryPoint } = deploy;

  const isDelist = entryPoint === CsprMarketDeployEntryPoint.delist_token;
  const isListAction =
    entryPoint === CsprMarketDeployEntryPoint.delist_token ||
    entryPoint === CsprMarketDeployEntryPoint.list_token;
  const isOfferAction =
    entryPoint === CsprMarketDeployEntryPoint.accept_offer ||
    entryPoint === CsprMarketDeployEntryPoint.make_offer ||
    entryPoint === CsprMarketDeployEntryPoint.cancel_offer;

  const title = getEntryPointName(deploy);

  if (isListAction) {
    return (
      <DeployContainer
        timestamp={deploy.timestamp}
        iconUrl={DeployIcon.CSPRMarket}
        title={title}
        deployStatus={{
          status: deploy.status,
          errorMessage: deploy.errorMessage
        }}
      >
        <NftAmount amountOfNFTs={deploy.amountOfNFTs} />
        <ContractRow
          label={isDelist ? 'from' : 'on'}
          contractName={deploy.contractName}
        />
      </DeployContainer>
    );
  }

  if (isOfferAction) {
    return (
      <DeployContainer
        timestamp={deploy.timestamp}
        iconUrl={DeployIcon.CSPRMarket}
        title={title}
        deployStatus={{
          status: deploy.status,
          errorMessage: deploy.errorMessage
        }}
      >
        <ContractRow label="on" contractName={deploy.contractName} />
      </DeployContainer>
    );
  }

  return <DefaultDeployRows deploy={deploy} />;
};
