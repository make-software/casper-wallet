import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DeployIcon } from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Link, Typography } from '@libs/ui/components';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

export const DeployDefault = ({
  contractLink,
  contractName,
  entryPointName,
  timestamp
}: {
  contractLink: string;
  contractName: string;
  entryPointName: string;
  timestamp: string;
}) => {
  const { t } = useTranslation();

  return (
    <DeployContainer
      iconUrl={DeployIcon.Generic}
      title={entryPointName}
      timestamp={timestamp}
    >
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>with</Trans>
        </Typography>
        <Link color="contentAction" href={contractLink}>
          <Typography type="captionRegular">{contractName}</Typography>
        </Link>
      </AlignedFlexRow>
    </DeployContainer>
  );
};
