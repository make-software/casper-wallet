import { IDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
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

  return (
    <DeployContainer
      iconUrl={DeployIcon.Generic}
      title={title}
      timestamp={deploy.timestamp}
      deployStatus={{
        status: deploy.status,
        errorMessage: deploy.errorMessage
      }}
    >
      {deploy.contractName && (
        <ContractRow label="with" contractName={deploy.contractName} />
      )}
    </DeployContainer>
  );
};
