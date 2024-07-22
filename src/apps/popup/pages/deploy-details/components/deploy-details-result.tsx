import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AssociatedKeysContractHash } from '@src/constants';

import { AssociatedResultRows } from '@popup/pages/deploy-details/components/result-rows/associated-result-rows';
import { Cep18ResultRows } from '@popup/pages/deploy-details/components/result-rows/cep18-result-rows';
import { NativeTransferResultRows } from '@popup/pages/deploy-details/components/result-rows/native-transfer-result-rows';
import { NftResultRows } from '@popup/pages/deploy-details/components/result-rows/nft-result-rows';

import {
  BorderBottomPseudoElementProps,
  FlexColumn,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { ExtendedCloudDeploy } from '@libs/types/deploy';
import { Status, Tile, Typography, getDeployStatus } from '@libs/ui/components';

const RowsContainer = styled(FlexColumn)<BorderBottomPseudoElementProps>`
  margin: 0;

  & > *:not(:last-child) {
    padding: 16px 16px 16px 0;
    ${borderBottomPseudoElementRules};
  }

  & > *:first-child {
    padding: 8px 0;
  }

  & > *:last-child {
    padding: 16px 16px 16px
      ${({ marginLeftForSeparatorLine }) => marginLeftForSeparatorLine}px;
  }
`;

const Container = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <Tile style={{ marginTop: '16px' }}>
      <RowsContainer marginLeftForSeparatorLine={16}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>Results</Trans>
        </Typography>
        {children}
      </RowsContainer>
    </Tile>
  );
};

interface DeployDetailsResultProps {
  deploy: ExtendedCloudDeploy;
}

export const DeployDetailsResult = ({ deploy }: DeployDetailsResultProps) => {
  const deployStatus = getDeployStatus(deploy);
  const { contractHash } = deploy;

  if (deployStatus === Status.Error) {
    return null;
  }

  const isAssociated =
    contractHash === AssociatedKeysContractHash.Mainnet ||
    contractHash === AssociatedKeysContractHash.Testnet;

  const showResultRow =
    deploy.transfers || deploy.nftActions || deploy.ftActions;

  if (isAssociated) {
    return (
      <Container>
        <AssociatedResultRows
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
        />
      </Container>
    );
  }

  if (!showResultRow) {
    return null;
  }

  return (
    <Container>
      {deploy.transfers?.map((transfer, idx) => (
        <NativeTransferResultRows
          amount={transfer.amount}
          key={idx}
          toPublicKey={'transfer.toPublicKey'}
          fromPublicKey={'transfer.fromPublicKey'}
          fiatAmount={'transfer.fiatAmount'}
        />
      ))}
      {deploy.ftActions?.map((ftAction, idx) => (
        <Cep18ResultRows ftAction={ftAction} key={idx} />
      ))}
      {deploy.nftActions?.map((nftAction, idx) => (
        <NftResultRows nftAction={nftAction} key={idx} />
      ))}
    </Container>
  );
};
