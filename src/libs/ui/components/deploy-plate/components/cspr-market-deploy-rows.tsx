import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  CsprMarketEntryPoint,
  CsprMarketEntryPointNameMap,
  DeployIcon
} from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Link, Typography } from '@libs/ui/components';
import { DefaultDeployRows } from '@libs/ui/components/deploy-plate/components/default-deploy-rows';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface CSPRMarketDeployRowsProps {
  entryPointName: CsprMarketEntryPoint;
  amountOfNFTs: number;
  contractLink: string;
  contractName: string;
  timestamp: string;
}

const LinkToCSPRMarketContract = ({ label }: { label: string }) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}>{label}</Trans>
      </Typography>
      {/* TODO: add link for casper studio */}
      <Link color="contentAction">
        <Typography type="captionRegular">CSPR.market</Typography>
      </Link>
    </AlignedFlexRow>
  );
};

export const CSPRMarketDeployRows = ({
  amountOfNFTs,
  entryPointName,
  contractLink,
  contractName,
  timestamp
}: CSPRMarketDeployRowsProps) => {
  const isDelist = entryPointName === CsprMarketEntryPoint.delist_token;
  const isListAction =
    entryPointName === CsprMarketEntryPoint.delist_token ||
    entryPointName === CsprMarketEntryPoint.list_token;
  const isOfferAction =
    entryPointName === CsprMarketEntryPoint.accept_offer ||
    entryPointName === CsprMarketEntryPoint.make_offer ||
    entryPointName === CsprMarketEntryPoint.cancel_offer;

  if (isListAction) {
    return (
      <DeployContainer
        timestamp={timestamp}
        iconUrl={DeployIcon.CSPRMarket}
        title={CsprMarketEntryPointNameMap[entryPointName]}
      >
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <Typography type="captionHash">{amountOfNFTs}</Typography>
          <Typography type="captionRegular">NFT(s)</Typography>
        </AlignedFlexRow>
        <LinkToCSPRMarketContract label={isDelist ? 'from' : 'on'} />
      </DeployContainer>
    );
  }

  if (isOfferAction) {
    return (
      <DeployContainer
        timestamp={timestamp}
        iconUrl={DeployIcon.CSPRMarket}
        title={CsprMarketEntryPointNameMap[entryPointName]}
      >
        <LinkToCSPRMarketContract label="on" />
      </DeployContainer>
    );
  }

  return (
    <DefaultDeployRows
      contractLink={contractLink}
      contractName={contractName}
      entryPointName={entryPointName}
      timestamp={timestamp}
    />
  );
};
