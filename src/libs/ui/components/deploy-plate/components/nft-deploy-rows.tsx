import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  DeployIcon,
  NftTokenEntryPoint,
  NftTokenEntryPointNameMap
} from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import {
  Avatar,
  Hash,
  HashVariant,
  Link,
  Typography
} from '@libs/ui/components';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface NftDeployRowsProps {
  amountOfNFTs: number;
  publicKey: string;
  entryPointName: NftTokenEntryPoint;
  timestamp: string;
}

const NftAmount = ({ amountOfNFTs }: { amountOfNFTs: number }) => (
  <AlignedFlexRow gap={SpacingSize.Tiny}>
    <Typography type="captionHash">{amountOfNFTs}</Typography>
    <Typography type="captionRegular">NFT(s)</Typography>
  </AlignedFlexRow>
);

const LinkToNftContract = () => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}>with</Trans>
      </Typography>
      {/* TODO: add link for casper studio */}
      <Link color="contentAction">
        <Typography type="captionRegular">CSPR.studio</Typography>
      </Link>
    </AlignedFlexRow>
  );
};

const RecipientInfo = ({
  publicKey,
  amountOfNFTs
}: {
  publicKey: string;
  amountOfNFTs: number;
}) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      <NftAmount amountOfNFTs={amountOfNFTs} />
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}>to</Trans>
      </Typography>
      <AlignedFlexRow gap={SpacingSize.Tiny}>
        <Avatar publicKey={publicKey} size={16} />
        <Hash
          value={publicKey}
          variant={HashVariant.CaptionHash}
          truncated
          truncatedSize="small"
          color="contentPrimary"
        />
      </AlignedFlexRow>
    </AlignedFlexRow>
  );
};

export const NftDeployRows = ({
  publicKey,
  amountOfNFTs,
  entryPointName,
  timestamp
}: NftDeployRowsProps) => {
  const isBurn = entryPointName === NftTokenEntryPoint.burn;
  const isMint = entryPointName === NftTokenEntryPoint.mint;
  const isTransfer = entryPointName === NftTokenEntryPoint.transfer;

  return (
    <DeployContainer
      timestamp={timestamp}
      iconUrl={DeployIcon.CSPRStudio}
      title={NftTokenEntryPointNameMap[entryPointName]}
    >
      {isBurn && (
        <>
          <NftAmount amountOfNFTs={amountOfNFTs} />
          <LinkToNftContract />
        </>
      )}
      {(isMint || isTransfer) && (
        <>
          <RecipientInfo publicKey={publicKey} amountOfNFTs={amountOfNFTs} />
          <LinkToNftContract />
        </>
      )}
      {!(isBurn || isMint || isTransfer) && <LinkToNftContract />}
    </DeployContainer>
  );
};
