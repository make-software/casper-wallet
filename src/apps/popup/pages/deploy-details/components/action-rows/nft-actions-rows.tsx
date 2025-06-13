import { INftDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { DeployIcon, NftDeployEntryPoint } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface NftActionsRowsProps {
  title: string;
  entryPoint: INftDeploy['entryPoint'];
  nftTokenIds: INftDeploy['nftTokenIds'];
  nftTokenUrlsMap: INftDeploy['nftTokenUrlsMap'];
  recipientKey: INftDeploy['recipientKey'];
  contractPackageHash: INftDeploy['contractPackageHash'];
  contractName: INftDeploy['contractName'];
  callerPublicKey: INftDeploy['callerPublicKey'];
  iconUrl: INftDeploy['iconUrl'];
  callerAccountInfo: INftDeploy['callerAccountInfo'];
  recipientAccountInfo: INftDeploy['recipientAccountInfo'];
  contractHash: INftDeploy['contractHash'];
  contractLink?: Maybe<string>;
}

export const NftActionsRows = ({
  title,
  entryPoint,
  nftTokenIds,
  nftTokenUrlsMap,
  recipientKey,
  contractPackageHash,
  contractName,
  callerPublicKey,
  iconUrl,
  callerAccountInfo,
  recipientAccountInfo,
  contractHash,
  contractLink
}: NftActionsRowsProps) => {
  const isBurn = entryPoint === NftDeployEntryPoint.burn;
  const isMint = entryPoint === NftDeployEntryPoint.mint;
  const isTransfer = entryPoint === NftDeployEntryPoint.transfer;
  const isUpdate = entryPoint === NftDeployEntryPoint.update_token_meta;
  const isApprove =
    entryPoint === NftDeployEntryPoint.approve ||
    entryPoint === NftDeployEntryPoint.set_approval_for_all;

  if (isBurn) {
    return (
      <SimpleContainer title={title}>
        <NftInfoRow
          contractPackageHash={contractPackageHash}
          contractName={contractName}
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          accountName={recipientAccountInfo?.name}
          label="owned by"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
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
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          accountName={recipientAccountInfo?.name}
          label="to"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
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
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={callerPublicKey}
          accountName={callerAccountInfo?.name}
          label="from"
          isAction
          iconSize={20}
          csprName={callerAccountInfo?.csprName}
          imgLogo={callerAccountInfo?.brandingLogo}
          accountLink={callerAccountInfo?.explorerLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          accountName={recipientAccountInfo?.name}
          label="to"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
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
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          defaultSvg={DeployIcon.NFTDefault}
          collectionHash={contractHash}
          contractLink={contractLink}
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
          imgLogo={iconUrl}
          nftTokenIds={nftTokenIds}
          nftTokenUrlsMap={nftTokenUrlsMap}
          defaultSvg={DeployIcon.NFTDefault}
          label="for"
          isApprove
          collectionHash={contractHash}
          contractLink={contractLink}
        />
        <AccountInfoRow
          publicKey={recipientKey}
          label="to"
          isAction
          iconSize={20}
          csprName={recipientAccountInfo?.csprName}
          imgLogo={recipientAccountInfo?.brandingLogo}
          accountLink={recipientAccountInfo?.explorerLink}
        />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      title={title}
      contractPackageHash={contractPackageHash}
      contractName={contractName}
      additionalInfo="CEP-47 NFT"
      iconUrl={iconUrl || DeployIcon.NFTDefault}
      contractLink={contractLink}
    />
  );
};
