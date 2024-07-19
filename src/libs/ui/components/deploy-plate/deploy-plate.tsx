import React from 'react';
import styled from 'styled-components';

import {
  AssociatedKeysContractHash,
  AuctionManagerContractHash,
  AuctionManagerEntryPoint_V2,
  CSPRMarketContractHash,
  Cep18EntryPoint,
  ContractTypeId,
  CsprMarketEntryPoint,
  ExecutionTypesMap,
  NftTokenEntryPoint,
  TRANSFER
} from '@src/constants';

import { AlignedSpaceBetweenFlexRow } from '@libs/layout';
import { SvgIcon } from '@libs/ui/components';
import { AssociatedDeployRows } from '@libs/ui/components/deploy-plate/components/associated-deploy-rows';
import { AuctionDeployRows } from '@libs/ui/components/deploy-plate/components/auction-deploy-rows';
import { Cep18DeployRows } from '@libs/ui/components/deploy-plate/components/cep18-deploy-rows';
import { CSPRMarketDeployRows } from '@libs/ui/components/deploy-plate/components/cspr-market-deploy-rows';
import { DefaultDeployRows } from '@libs/ui/components/deploy-plate/components/default-deploy-rows';
import { NativeTransferDeployRows } from '@libs/ui/components/deploy-plate/components/native-transfer-deploy-rows';
import { NftDeployRows } from '@libs/ui/components/deploy-plate/components/nft-deploy-rows';

const Container = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px 12px 16px;

  background: ${props => props.theme.color.backgroundPrimary};

  cursor: pointer;
`;

interface DeployPlateProps {
  // update this type
  deploy: any;
}

export const DeployPlate = ({ deploy }: DeployPlateProps) => {
  const { executionTypeId, contractPackage, contractHash } = deploy;

  // remove this after we add types for deploy
  // @ts-ignore
  const deployType = ExecutionTypesMap[executionTypeId];
  const isTransfer = deploy.executionTypeId === TRANSFER;
  const isWASMDeploy = deployType === 'WASM deploy';

  const contractTypeId =
    contractPackage.latest_version_contract_type_id ||
    contractPackage.contract_type_id;

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
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <NativeTransferDeployRows
          publicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          amount="1,000,000.00"
          isTransactionIn={true}
          timestamp="2024-07-03T08:31:23.577Z"
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  if (isWASMDeploy) {
    return (
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <DefaultDeployRows
          contractLink="link"
          contractName="name"
          timestamp="2024-07-03T08:31:23.577Z"
          entryPointName={'entryPointName'}
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  if (isAuction) {
    return (
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <AuctionDeployRows
          validatorPublicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          newValidatorPublicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          amount="1,000,000.00"
          entryPointName={AuctionManagerEntryPoint_V2.activate}
          contractLink=""
          contractName=""
          timestamp="2024-07-03T08:31:23.577Z"
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  if (isAssociated) {
    return (
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <AssociatedDeployRows
          contractName="name"
          contractLink="link"
          timestamp="2024-07-03T08:31:23.577Z"
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  if (isCSPRMarket) {
    return (
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <CSPRMarketDeployRows
          amountOfNFTs={2}
          entryPointName={CsprMarketEntryPoint.accept_offer}
          contractName="name"
          contractLink="link"
          timestamp="2024-07-03T08:31:23.577Z"
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  if (isCep18) {
    return (
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <Cep18DeployRows
          amount="1,000,000.00"
          publicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          tokenName="Beast Coin"
          symbol="BOIN"
          contractLink=""
          entryPointName={Cep18EntryPoint.burn}
          timestamp="2024-07-03T08:31:23.577Z"
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  if (isNFT) {
    return (
      <Container
        onClick={() => {
          // need to pass props to view transaction details
          // navigate(RouterPath.DeployDetails);
        }}
      >
        <NftDeployRows
          publicKey="02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5"
          amountOfNFTs={2}
          entryPointName={NftTokenEntryPoint.update_token_meta}
          timestamp="2024-07-03T08:31:23.577Z"
        />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </Container>
    );
  }

  return (
    <Container
      onClick={() => {
        // need to pass props to view transaction details
        // navigate(RouterPath.DeployDetails);
      }}
    >
      <DefaultDeployRows
        contractLink="link"
        contractName="name"
        timestamp="2024-07-03T08:31:23.577Z"
        entryPointName={'entryPointName'}
      />
      <SvgIcon src="assets/icons/chevron.svg" size={16} />
    </Container>
  );
};
