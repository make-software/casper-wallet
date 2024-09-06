import { IDeploy } from 'casper-wallet-core';
import {
  isAssociatedKeysDeploy,
  isCasperMarketDeploy,
  isCep18Deploy,
  isNftDeploy
} from 'casper-wallet-core/src/utils/deploy';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AssociatedResultRows } from '@popup/pages/deploy-details/components/result-rows/associated-result-rows';
import { Cep18ResultRows } from '@popup/pages/deploy-details/components/result-rows/cep18-result-rows';
import { NativeTransferResultRows } from '@popup/pages/deploy-details/components/result-rows/native-transfer-result-rows';
import { NftResultRows } from '@popup/pages/deploy-details/components/result-rows/nft-result-rows';

import {
  BorderBottomPseudoElementProps,
  FlexColumn,
  borderBottomPseudoElementRules
} from '@libs/layout';
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
  deploy: IDeploy;
}

export const DeployDetailsResult = ({ deploy }: DeployDetailsResultProps) => {
  const deployStatus = getDeployStatus(deploy);

  if (deployStatus === Status.Error) {
    return null;
  }

  const showResultRow = Boolean(
    deploy.status !== 'error' &&
      (deploy.transfersActionsResult.length ||
        (isNftDeploy(deploy) && deploy.nftActionsResult.length) ||
        (isCep18Deploy(deploy) && deploy.cep18ActionsResult.length) ||
        isAssociatedKeysDeploy(deploy))
  );

  if (!showResultRow) return null;

  if (isAssociatedKeysDeploy(deploy)) {
    return (
      <Container>
        <AssociatedResultRows publicKey={deploy.callerPublicKey} />
      </Container>
    );
  }

  if (deploy.transfersActionsResult.length) {
    return (
      <Container>
        {deploy?.transfersActionsResult.map((action, id) => (
          <NativeTransferResultRows
            amount={action.formattedDecimalAmount}
            key={id}
            callerAccountInfo={action.callerAccountInfo}
            recipientAccountInfo={action.recipientAccountInfo}
            toPublicKey={action.recipientKey}
            fromPublicKey={action.callerPublicKey}
            fiatAmount={action.fiatAmount}
          />
        ))}
        {isCep18Deploy(deploy) &&
          deploy.cep18ActionsResult.map((action, id) => (
            <Cep18ResultRows
              action={action}
              key={id}
              contractPackageHash={deploy.contractPackageHash}
            />
          ))}
        {(isNftDeploy(deploy) || isCasperMarketDeploy(deploy)) &&
          deploy.nftActionsResult.map((action, id) => (
            <NftResultRows
              action={action}
              key={id}
              contractPackageHash={deploy.contractPackageHash}
            />
          ))}
      </Container>
    );
  }
};
