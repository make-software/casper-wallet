import { INftDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import React from 'react';

import { DeployIcon, NftDeployEntryPoint } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import {
  ContractRow,
  NftAmount
} from '@libs/ui/components/deploy-plate/components/common';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface NftDeployRowsProps {
  deploy: INftDeploy;
}

export const NftDeployRows = ({ deploy }: NftDeployRowsProps) => {
  const { entryPoint } = deploy;
  const isBurn = entryPoint === NftDeployEntryPoint.burn;
  const isMint = entryPoint === NftDeployEntryPoint.mint;
  const isTransfer =
    entryPoint === NftDeployEntryPoint.transfer ||
    entryPoint === NftDeployEntryPoint.transfer_from ||
    entryPoint === NftDeployEntryPoint.safe_transfer_from;
  const isApprove =
    entryPoint === NftDeployEntryPoint.approve ||
    entryPoint === NftDeployEntryPoint.set_approval_for_all;

  const title = getEntryPointName(deploy);

  return (
    <DeployContainer
      timestamp={deploy.timestamp}
      iconUrl={deploy.iconUrl || DeployIcon.NFTDefault}
      title={title}
      deployStatus={{
        status: deploy.status,
        errorMessage: deploy.errorMessage
      }}
    >
      {isBurn && (
        <>
          <NftAmount amountOfNFTs={deploy.amountOfNFTs} />
          <ContractRow label="with" contractName={deploy.contractName} />
        </>
      )}
      {isApprove && (
        <>
          <AccountInfoRow
            label="to"
            publicKey={deploy.recipientKey}
            accountName={
              deploy.isReceive
                ? deploy.callerAccountInfo?.name
                : deploy.recipientAccountInfo?.name
            }
            imgLogo={
              deploy.isReceive
                ? deploy.callerAccountInfo?.brandingLogo
                : deploy.recipientAccountInfo?.brandingLogo
            }
            csprName={
              deploy.isReceive
                ? deploy.callerAccountInfo?.csprName
                : deploy.recipientAccountInfo?.csprName
            }
          >
            <NftAmount amountOfNFTs={deploy.amountOfNFTs} />
          </AccountInfoRow>
          <ContractRow label="with" contractName={deploy.contractName} />
        </>
      )}
      {(isMint || isTransfer) && (
        <>
          <AccountInfoRow
            label="to"
            publicKey={deploy.recipientKey}
            accountName={
              deploy.isReceive
                ? deploy.callerAccountInfo?.name
                : deploy.recipientAccountInfo?.name
            }
            imgLogo={
              deploy.isReceive
                ? deploy.callerAccountInfo?.brandingLogo
                : deploy.recipientAccountInfo?.brandingLogo
            }
            csprName={
              deploy.isReceive
                ? deploy.callerAccountInfo?.csprName
                : deploy.recipientAccountInfo?.csprName
            }
          >
            <NftAmount amountOfNFTs={deploy.amountOfNFTs} />
          </AccountInfoRow>
          <ContractRow label="with" contractName={deploy.contractName} />
        </>
      )}
      {!(isBurn || isMint || isTransfer || isApprove) && (
        <ContractRow label="with" contractName={deploy.contractName} />
      )}
    </DeployContainer>
  );
};
