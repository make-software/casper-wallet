import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AssociatedKeysContractHash,
  AuctionManagerContractHash,
  CSPRMarketContractHash,
  ContractTypeId,
  ExecutionTypesMap,
  TRANSFER
} from '@src/constants';

import { AssociatedActionRows } from '@popup/pages/deploy-details/components/action-rows/associated-action-rows';
import { AuctionActionRows } from '@popup/pages/deploy-details/components/action-rows/auction-action-rows';
import { Cep18ActionRows } from '@popup/pages/deploy-details/components/action-rows/cep18-action-rows';
import { CsprMarketActionRows } from '@popup/pages/deploy-details/components/action-rows/cspr-market-action-rows';
import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import { NativeTransferActionRows } from '@popup/pages/deploy-details/components/action-rows/native-transfer-action-rows';
import { NftActionsRows } from '@popup/pages/deploy-details/components/action-rows/nft-actions-rows';

import {
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  FlexColumn,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { ExtendedCloudDeploy } from '@libs/types/deploy';
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
  deploy: ExtendedCloudDeploy;
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
  const { executionTypeId, contractPackage, contractHash, entryPoint } = deploy;

  // remove this after we add types for deploy
  const deployType = ExecutionTypesMap[executionTypeId];
  const isTransfer = deploy.executionTypeId === TRANSFER;
  const isWASMDeploy = deployType === 'WASM deploy';

  const entryPointName = entryPoint?.name || '';

  const contractTypeId =
    contractPackage?.latest_version_contract_type_id ||
    contractPackage?.contract_type_id;

  const isNativeTransfer = isTransfer && deploy.transfers;
  const isAuction =
    contractHash === AuctionManagerContractHash.Mainnet ||
    contractHash === AuctionManagerContractHash.Testnet;
  const isNFT =
    contractTypeId === ContractTypeId.CEP78Nft ||
    contractTypeId === ContractTypeId.CEP47Nft ||
    contractTypeId === ContractTypeId.CustomCEP78Nft ||
    contractTypeId === ContractTypeId.CustomCEP47Nft;
  const isCep18 =
    contractTypeId === ContractTypeId.CustomCep18 ||
    contractTypeId === ContractTypeId.Cep18;
  const isCSPRMarket =
    contractHash === CSPRMarketContractHash.Mainnet ||
    contractHash === CSPRMarketContractHash.Testnet;
  const isAssociated =
    contractHash === AssociatedKeysContractHash.Mainnet ||
    contractHash === AssociatedKeysContractHash.Testnet;

  if (isNativeTransfer) {
    return (
      <Container>
        <NativeTransferActionRows
          amount="500.4213"
          fiatAmount="$386.34"
          publicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
        />
      </Container>
    );
  }

  if (isWASMDeploy) {
    return (
      <Container>
        <Typography type="bodySemiBold">{deployType}</Typography>
      </Container>
    );
  }

  if (isAuction) {
    return (
      <Container>
        <AuctionActionRows
          fiatAmount="$386.34"
          amount="500.4213"
          entryPointName={entryPointName}
          validatorPublicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          newValidatorPublicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          contractLink="link"
          contractName="name"
        />
      </Container>
    );
  }

  if (isAssociated) {
    return (
      <Container>
        <AssociatedActionRows
          contractLink={'link'}
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
        />
      </Container>
    );
  }

  if (isCSPRMarket) {
    return (
      <Container>
        <CsprMarketActionRows
          entryPointName={entryPointName}
          nftName={'eggforce_nft'}
          nftId={'1890'}
          amount={'500.3933'}
          fiatAmount={'$386.34'}
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          csprMarketLink={'link'}
        />
      </Container>
    );
  }

  if (isCep18) {
    return (
      <Container>
        <Cep18ActionRows
          entryPointName={entryPointName}
          amount="500.4213"
          symbol="BOIN"
          contractLink="link"
          contractName="name"
          publicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
        />
      </Container>
    );
  }

  if (isNFT) {
    return (
      <Container>
        <NftActionsRows
          entryPointName={entryPointName}
          nftId="1234"
          publicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          newOwnerPublicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
        />
      </Container>
    );
  }

  return (
    <Container>
      <DefaultActionRows
        entryPointName={entryPointName}
        contractLink="link"
        contractName="name"
      />
    </Container>
  );
};
