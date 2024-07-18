import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DeployIcon } from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Link, Typography } from '@libs/ui/components';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface AssociatedDeployRowsProps {
  contractName: string;
  contractLink: string;
  timestamp: string;
}

export const AssociatedDeployRows = ({
  contractName,
  contractLink,
  timestamp
}: AssociatedDeployRowsProps) => {
  const { t } = useTranslation();

  return (
    <DeployContainer
      timestamp={timestamp}
      iconUrl={DeployIcon.AssociatedKeys}
      title="Update account"
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
