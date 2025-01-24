import { IDeploy } from 'casper-wallet-core';
import {
  isAssociatedKeysDeploy,
  isAuctionDeploy,
  isCasperMarketDeploy,
  isCep18Deploy,
  isNativeCsprDeploy,
  isNftDeploy,
  isWasmDeployExecutionType
} from 'casper-wallet-core/src/utils/deploy';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AssociatedActionRows } from '@popup/pages/deploy-details/components/action-rows/associated-action-rows';
import { AuctionActionRows } from '@popup/pages/deploy-details/components/action-rows/auction-action-rows';
import { Cep18ActionRows } from '@popup/pages/deploy-details/components/action-rows/cep18-action-rows';
import { CsprMarketActionRows } from '@popup/pages/deploy-details/components/action-rows/cspr-market-action-rows';
import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import { NativeTransferActionRows } from '@popup/pages/deploy-details/components/action-rows/native-transfer-action-rows';
import { NftActionsRows } from '@popup/pages/deploy-details/components/action-rows/nft-actions-rows';
import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import {
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  FlexColumn,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { Tile, Typography } from '@libs/ui/components';

const RowsContainer = styled(FlexColumn)<BorderBottomPseudoElementProps>`
  margin-top: 16px;

  & > *:not(:last-child) {
    ${borderBottomPseudoElementRules};
  }

  & > *:first-child {
    padding: 8px 0;
  }
`;

const RowContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px;
`;

interface ActionProps {
  deploy: IDeploy;
}

const Container = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <Tile style={{ marginTop: '16px' }}>
      <RowsContainer marginLeftForSeparatorLine={16}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>Action</Trans>
        </Typography>
        <RowContainer>{children}</RowContainer>
      </RowsContainer>
    </Tile>
  );
};

export const DeployDetailsAction = ({ deploy }: ActionProps) => {
  const title = getEntryPointName(deploy, true);

  if (isNativeCsprDeploy(deploy)) {
    return (
      <Container>
        <NativeTransferActionRows title={title} deploy={deploy} />
      </Container>
    );
  }

  if (isWasmDeployExecutionType(deploy)) {
    return (
      <Container>
        <Typography type="bodySemiBold">{title}</Typography>
      </Container>
    );
  }

  if (isAuctionDeploy(deploy)) {
    return (
      <Container>
        <AuctionActionRows deploy={deploy} />
      </Container>
    );
  }

  if (isAssociatedKeysDeploy(deploy)) {
    return (
      <Container>
        <AssociatedActionRows
          contractPackageHash={deploy.contractPackageHash}
          publicKey={deploy.callerPublicKey}
          contractName={deploy.contractName}
          callerAccountInfo={deploy.callerAccountInfo}
        />
      </Container>
    );
  }

  if (isCasperMarketDeploy(deploy)) {
    return (
      <Container>
        <CsprMarketActionRows deploy={deploy} />
      </Container>
    );
  }

  if (isCep18Deploy(deploy)) {
    return (
      <Container>
        <Cep18ActionRows deploy={deploy} />
      </Container>
    );
  }

  if (isNftDeploy(deploy)) {
    return (
      <Container>
        <NftActionsRows deploy={deploy} />
      </Container>
    );
  }

  return (
    <Container>
      <DefaultActionRows
        title={title}
        contractName={deploy.contractName}
        contractPackageHash={deploy.contractPackageHash}
      />
    </Container>
  );
};
