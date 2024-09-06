import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { DeployIcon, getBlockExplorerContractPackageUrl } from '@src/constants';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Link, Typography } from '@libs/ui/components';
import { AccountInfoIcon } from '@libs/ui/components/account-info-icon/account-info-icon';

interface DefaultActionRowsProps {
  title: string;
  contractName: Maybe<string>;
  additionalInfo?: string;
  iconUrl?: string;
  contractPackageHash: string;
}

export const DefaultActionRows = ({
  title,
  contractName,
  additionalInfo,
  iconUrl,
  contractPackageHash
}: DefaultActionRowsProps) => {
  const { t } = useTranslation();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const link = getBlockExplorerContractPackageUrl(
    casperLiveUrl,
    contractPackageHash || ''
  );

  return (
    <SimpleContainer title={title}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>with</Trans>
        </Typography>
        <AccountInfoIcon
          publicKey={contractPackageHash}
          size={20}
          accountName={contractName}
          iconUrl={iconUrl}
          defaultSvg={DeployIcon.Generic}
        />
        <Link color="contentAction" href={link} target="_blank">
          <Typography type="captionRegular">{contractName}</Typography>
        </Link>
        {additionalInfo && (
          <Typography type="captionRegular" color="contentSecondary">
            {additionalInfo}
          </Typography>
        )}
      </AlignedFlexRow>
    </SimpleContainer>
  );
};
