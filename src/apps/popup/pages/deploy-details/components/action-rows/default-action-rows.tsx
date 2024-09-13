import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { DeployIcon } from '@src/constants';

import {
  ContractInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

interface DefaultActionRowsProps {
  title: string;
  contractName: Maybe<string>;
  additionalInfo?: string;
  iconUrl?: string;
  contractPackageHash: string;
}

export const DefaultActionRows = ({
  title,
  contractName,
  additionalInfo,
  iconUrl,
  contractPackageHash
}: DefaultActionRowsProps) => {
  return (
    <SimpleContainer title={title}>
      <ContractInfoRow
        contractPackageHash={contractPackageHash}
        contractName={contractName || 'Unknown Contract'}
        label="with"
        iconUrl={iconUrl}
        additionalInfo={additionalInfo}
        defaultSvg={DeployIcon.Generic}
      />
    </SimpleContainer>
  );
};
