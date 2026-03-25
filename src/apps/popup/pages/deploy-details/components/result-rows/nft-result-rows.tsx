import { INftActionsResult } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import {
  DeployIcon,
  DeployResultEntryPointNameMap,
  NftDeployEntryPoint
} from '@src/constants';

import {
  ContractInfoRow,
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { useFetchContractPackage } from '@libs/services/contract-package';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NftResultRowsProps {
  action: INftActionsResult;
  contractPackageHash: string;
  contractHash: string;
  collectionHash: string;
  collectionName?: string;
}

export const NftResultRows = ({
  action,
  contractPackageHash,
  contractHash,
  collectionHash,
  collectionName
}: NftResultRowsProps) => {
  const {
    entryPoint,
    nftTokenIds,
    nftTokenUrlsMap,
    recipientKey,
    recipientKeyType,
    callerPublicKey,
    callerKeyType,
    iconUrl,
    recipientAccountInfo,
    callerAccountInfo
  } = action;

  const isBurn = entryPoint === NftDeployEntryPoint.burn;
  const isMint = entryPoint === NftDeployEntryPoint.mint;
  const isTransfer =
    entryPoint === NftDeployEntryPoint.transfer ||
    entryPoint === NftDeployEntryPoint.transfer_from ||
    entryPoint === NftDeployEntryPoint.safe_transfer_from;
  const isUpdate = entryPoint === NftDeployEntryPoint.update_token_meta;
  const isApprove =
    entryPoint === NftDeployEntryPoint.approve ||
    entryPoint === NftDeployEntryPoint.set_approval_for_all;

  const title = DeployResultEntryPointNameMap[action.entryPoint];

  const { contractPackage: callerContractPackage } = useFetchContractPackage(
    callerKeyType === 'contractHash' ? callerPublicKey : null
  );

  const { contractPackage: recipientContractPackage } = useFetchContractPackage(
    recipientKeyType === 'contractHash' ? recipientKey : null
  );

  if (isBurn) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionName={collectionName}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={collectionHash}
        />
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="owned by"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey || callerPublicKey}
            accountName={recipientAccountInfo?.name || callerAccountInfo?.name}
            label="owned by"
            isAction
            iconSize={20}
            csprName={
              recipientAccountInfo?.csprName || callerAccountInfo?.csprName
            }
            imgLogo={
              recipientAccountInfo?.brandingLogo ||
              callerAccountInfo?.brandingLogo
            }
          />
        )}
      </SimpleContainer>
    );
  }

  if (isMint) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionName={collectionName}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={collectionHash}
        />
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="to"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            accountName={recipientAccountInfo?.name}
            label="to"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
      </SimpleContainer>
    );
  }

  if (isTransfer) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionName={collectionName}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={collectionHash}
        />
        {callerKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="from"
            contractPackageHash={callerPublicKey}
            contractName={callerContractPackage?.name || ''}
            iconUrl={callerContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={callerPublicKey}
            accountName={callerAccountInfo?.name}
            label="from"
            isAction
            iconSize={20}
            csprName={callerAccountInfo?.csprName}
            imgLogo={callerAccountInfo?.brandingLogo}
          />
        )}
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="to"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            accountName={recipientAccountInfo?.name}
            label="to"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
      </SimpleContainer>
    );
  }

  if (isUpdate) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionName={collectionName}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          label={'for'}
          collectionHash={collectionHash}
        />
      </SimpleContainer>
    );
  }

  if (isApprove) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractHash={contractHash}
          collectionName={collectionName}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          label={'for'}
          isApprove
          collectionHash={collectionHash}
        />
        {recipientKeyType === 'contractHash' ? (
          <ContractInfoRow
            label="to"
            contractName={recipientContractPackage?.name || ''}
            contractPackageHash={recipientKey}
            iconUrl={recipientContractPackage?.iconUrl}
            defaultSvg={DeployIcon.Cep18Default}
          />
        ) : (
          <AccountInfoRow
            publicKey={recipientKey}
            label="to"
            isAction
            iconSize={20}
            csprName={recipientAccountInfo?.csprName}
            imgLogo={recipientAccountInfo?.brandingLogo}
          />
        )}
      </SimpleContainer>
    );
  }

  return null;
};
