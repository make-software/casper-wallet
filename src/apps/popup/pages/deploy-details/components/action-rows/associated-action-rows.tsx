import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
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
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface AssociatedActionRowsProps {
  publicKey: string;
  contractPackageHash: string;
  contractName: string;
  callerAccountInfo: Maybe<IAccountInfo>;
  contractLink?: Maybe<string>;
}

export const AssociatedActionRows = ({
  publicKey,
  contractPackageHash,
  contractName,
  callerAccountInfo,
  contractLink
}: AssociatedActionRowsProps) => {
  const { t } = useTranslation();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const link = getBlockExplorerContractPackageUrl(
    casperLiveUrl,
    contractPackageHash || ''
  );

  return (
    <SimpleContainer title={'Update account'}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <AccountInfoRow
          publicKey={publicKey}
          iconSize={20}
          accountName={callerAccountInfo?.name}
          isAction
          csprName={callerAccountInfo?.csprName}
          imgLogo={callerAccountInfo?.brandingLogo}
          accountLink={callerAccountInfo?.explorerLink}
        />
      </AlignedFlexRow>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>with</Trans>
        </Typography>
        <AccountInfoIcon
          publicKey={contractPackageHash}
          size={20}
          accountName={contractName}
          iconUrl={DeployIcon.AssociatedKeys}
        />
        <Link color="contentAction" href={contractLink ?? link} target="_blank">
          <Typography type="captionRegular">{contractName}</Typography>
        </Link>
      </AlignedFlexRow>
      <AlignedFlexRow>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>contract</Trans>
        </Typography>
      </AlignedFlexRow>
    </SimpleContainer>
  );
};
