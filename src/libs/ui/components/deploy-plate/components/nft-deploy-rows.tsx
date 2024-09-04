import { INftDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { DeployIcon, NftDeployEntryPoint } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { ContractRow } from '@libs/ui/components/deploy-plate/components/common';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface NftDeployRowsProps {
  deploy: INftDeploy;
}

const NftAmount = ({ amountOfNFTs }: { amountOfNFTs: Maybe<number> }) => (
  <AlignedFlexRow gap={SpacingSize.Tiny}>
    <Typography type="captionHash">{amountOfNFTs}</Typography>
    <Typography type="captionRegular">NFT(s)</Typography>
  </AlignedFlexRow>
);

export const NftDeployRows = ({ deploy }: NftDeployRowsProps) => {
  const { entryPoint } = deploy;
  const isBurn = entryPoint === NftDeployEntryPoint.burn;
  const isMint = entryPoint === NftDeployEntryPoint.mint;
  const isTransfer = entryPoint === NftDeployEntryPoint.transfer;
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
            imgLogo={deploy.iconUrl}
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
