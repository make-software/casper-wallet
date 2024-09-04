import { IAssociatedKeysDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { DeployIcon } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { ContractRow } from '@libs/ui/components/deploy-plate/components/common';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface AssociatedDeployRowsProps {
  deploy: IAssociatedKeysDeploy;
}

export const AssociatedDeployRows = ({ deploy }: AssociatedDeployRowsProps) => {
  const title = getEntryPointName(deploy);

  return (
    <DeployContainer
      timestamp={deploy.timestamp}
      iconUrl={DeployIcon.AssociatedKeys}
      title={title}
      deployStatus={{
        status: deploy.status,
        errorMessage: deploy.errorMessage
      }}
    >
      <ContractRow label="with" contractName={deploy.contractName} />
    </DeployContainer>
  );
};
