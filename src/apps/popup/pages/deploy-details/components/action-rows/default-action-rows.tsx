import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DeployIcon } from '@src/constants';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Link, SvgIcon, Typography } from '@libs/ui/components';

interface DefaultActionRowsProps {
  entryPointName: string;
  contractLink: string;
  contractName: string;
  additionalInfo?: string;
  iconUrl?: string;
}

export const DefaultActionRows = ({
  entryPointName,
  contractLink,
  contractName,
  additionalInfo,
  iconUrl = DeployIcon.Generic // default icon for actions with no custom icon provided
}: DefaultActionRowsProps) => {
  const { t } = useTranslation();

  return (
    <SimpleContainer entryPointName={entryPointName}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>with</Trans>
        </Typography>
        <SvgIcon src={iconUrl} size={20} />
        <Link color="contentAction" href={contractLink}>
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
