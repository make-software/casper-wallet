import {
  IDeploy,
  formatAddress,
  isWasmDeploy,
  isWasmProxyDeploy
} from 'casper-wallet-core';
import React from 'react';

import { DeployIcon } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { ContractRow } from '@libs/ui/components/deploy-plate/components/common';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface DefaultDeployRowsProps {
  deploy: IDeploy;
}

export const DefaultDeployRows = ({ deploy }: DefaultDeployRowsProps) => {
  const title = getEntryPointName(deploy);

  const contractIdentification =
    deploy.contractName || formatAddress(deploy.contractPackageHash) || '';

  return (
    <DeployContainer
      iconUrl={
        isWasmDeploy(deploy) || isWasmProxyDeploy(deploy)
          ? DeployIcon.Wasm
          : DeployIcon.Generic
      }
      title={title}
      timestamp={deploy.timestamp}
      deployStatus={{
        status: deploy.status,
        errorMessage: deploy.errorMessage
      }}
    >
      {contractIdentification && !isWasmDeploy(deploy) && (
        <ContractRow label="with" contractName={contractIdentification} />
      )}
    </DeployContainer>
  );
};
