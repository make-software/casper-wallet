import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';

export const ContractRow = ({
  label,
  contractName
}: {
  label: string;
  contractName: string;
}) => {
  const { t } = useTranslation();

  return (
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}>{label}</Trans>
      </Typography>
      <Typography type="captionRegular" color="contentPrimary">
        {contractName}
      </Typography>
    </AlignedFlexRow>
  );
};

export const NftAmount = ({
  amountOfNFTs
}: {
  amountOfNFTs: Maybe<number>;
}) => (
  <AlignedFlexRow gap={SpacingSize.Tiny} flexGrow={0}>
    <Typography type="captionHash">{amountOfNFTs}</Typography>
    <Typography type="captionRegular">NFT(s)</Typography>
  </AlignedFlexRow>
);
