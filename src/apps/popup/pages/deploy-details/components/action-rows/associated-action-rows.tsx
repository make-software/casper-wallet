import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DeployIcon } from '@src/constants';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import {
  Avatar,
  Hash,
  HashVariant,
  Link,
  SvgIcon,
  Typography
} from '@libs/ui/components';

interface AssociatedActionRowsProps {
  publicKey: string;
  contractLink: string;
}

export const AssociatedActionRows = ({
  publicKey,
  contractLink
}: AssociatedActionRowsProps) => {
  const { t } = useTranslation();

  return (
    <SimpleContainer entryPointName={'Update account'}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Avatar publicKey={publicKey} size={20} />
        <Hash
          value={publicKey}
          variant={HashVariant.CaptionHash}
          truncated
          truncatedSize="small"
          color="contentAction"
        />
      </AlignedFlexRow>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>with</Trans>
        </Typography>
        <SvgIcon src={DeployIcon.AssociatedKeys} size={20} />
        <Link color="contentAction" href={contractLink}>
          <Typography type="captionRegular">
            Associated Key Management
          </Typography>
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
