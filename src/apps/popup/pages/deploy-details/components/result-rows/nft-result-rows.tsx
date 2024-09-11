import { INftActionsResult } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import {
  DeployIcon,
  DeployResultEntryPointNameMap,
  NftDeployEntryPoint
} from '@src/constants';

import {
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NftResultRowsProps {
  action: INftActionsResult;
  contractPackageHash: string;
  contractHash: string;
}

export const NftResultRows = ({
  action,
  contractPackageHash,
  contractHash
}: NftResultRowsProps) => {
  const {
    entryPoint,
    nftTokenIds,
    recipientKey,
    callerPublicKey,
    contractName,
    iconUrl,
    recipientAccountInfo,
    callerAccountInfo
  } = action;

  const isBurn = entryPoint === NftDeployEntryPoint.burn;
  const isMint = entryPoint === NftDeployEntryPoint.mint;
  const isTransfer = entryPoint === NftDeployEntryPoint.transfer;
  const isUpdate = entryPoint === NftDeployEntryPoint.update_token_meta;
  const isApprove =
    entryPoint === NftDeployEntryPoint.approve ||
    entryPoint === NftDeployEntryPoint.set_approval_for_all;

  const title = DeployResultEntryPointNameMap[action.entryPoint];

  if (isBurn) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          nftTokenIds={nftTokenIds}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
        />
        <AccountInfoRow
          publicKey={recipientKey || callerPublicKey}
          accountName={recipientAccountInfo?.name || callerAccountInfo?.name}
          label="owned by"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  if (isMint) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          nftTokenIds={nftTokenIds}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          accountName={recipientAccountInfo?.name}
          label="to"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  if (isTransfer) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          nftTokenIds={nftTokenIds}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
        />
        <AccountInfoRow
          publicKey={callerPublicKey}
          accountName={callerAccountInfo?.name}
          label="from"
          isAction
          iconSize={20}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          accountName={recipientAccountInfo?.name}
          label="to"
          isAction
          iconSize={20}
        />
      </SimpleContainer>
    );
  }

  if (isUpdate) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          nftTokenIds={nftTokenIds}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          label={'for'}
          collectionHash={contractHash}
        />
      </SimpleContainer>
    );
  }

  if (isApprove) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          nftTokenIds={nftTokenIds}
          imgLogo={iconUrl}
          defaultSvg={DeployIcon.NFTDefault}
          label={'for'}
          isApprove
          collectionHash={contractHash}
        />
        <AccountInfoRow publicKey={recipientKey} label="to" isAction />
      </SimpleContainer>
    );
  }

  return null;
};
