import { INftDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { DeployIcon, NftDeployEntryPoint } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';
import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NftActionsRowsProps {
  deploy: INftDeploy;
}

export const NftActionsRows = ({ deploy }: NftActionsRowsProps) => {
  const {
    entryPoint,
    nftTokenIds,
    recipientKey,
    contractPackageHash,
    contractName,
    callerPublicKey,
    iconUrl,
    callerAccountInfo,
    recipientAccountInfo
  } = deploy;
  const isBurn = entryPoint === NftDeployEntryPoint.burn;
  const isMint = entryPoint === NftDeployEntryPoint.mint;
  const isTransfer = entryPoint === NftDeployEntryPoint.transfer;
  const isUpdate = entryPoint === NftDeployEntryPoint.update_token_meta;
  const isApprove =
    entryPoint === NftDeployEntryPoint.approve ||
    entryPoint === NftDeployEntryPoint.set_approval_for_all;

  const title = getEntryPointName(deploy, true);

  if (isBurn) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          publicKey={contractPackageHash}
          contractName={contractName}
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          defaultSvg={DeployIcon.NFTDefault}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          accountName={recipientAccountInfo?.name}
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
          publicKey={contractPackageHash}
          contractName={contractName}
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          defaultSvg={DeployIcon.NFTDefault}
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
          publicKey={contractPackageHash}
          contractName={contractName}
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          defaultSvg={DeployIcon.NFTDefault}
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
          publicKey={contractPackageHash}
          contractName={contractName}
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          defaultSvg={DeployIcon.NFTDefault}
        />
      </SimpleContainer>
    );
  }

  if (isApprove) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          publicKey={contractPackageHash}
          contractName={contractName}
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          defaultSvg={DeployIcon.NFTDefault}
          label="for"
          isApprove
        />
        <AccountInfoRow publicKey={recipientKey} label="to" isAction />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      title={title}
      contractPackageHash={contractPackageHash}
      contractName={contractName}
      additionalInfo="CEP-47 NFT"
      iconUrl={DeployIcon.NFTDefault}
    />
  );
};
