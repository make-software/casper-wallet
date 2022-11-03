import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { Button, Typography } from '@src/libs/ui';
import {
  AlignedSpaceBetweenFlexRow,
  SpaceBetweenFlexColumn,
  VerticalSpaceContainer
} from '@src/libs/layout';

const SiteGroupHeaderContainer = styled(SpaceBetweenFlexColumn)`
  padding: ${({ theme }) => theme.padding[1.6]};
`;

const SiteGroupHeaderActionContainer = styled(AlignedSpaceBetweenFlexRow)``;

interface SiteGroupHeaderProps {
  siteTitle: string;
  siteOrder: number;
  disconnectSite: () => void;
}

export function SiteGroupHeader({
  siteTitle,
  siteOrder,
  disconnectSite
}: SiteGroupHeaderProps) {
  const { t } = useTranslation();

  return (
    <SiteGroupHeaderContainer>
      <SiteGroupHeaderActionContainer>
        <Typography type="bodySemiBold" color="contentPrimary">
          <Trans t={t}>Site</Trans> {siteOrder}
        </Typography>

        <Button
          width="120"
          variant="inline"
          color="primaryRed"
          onClick={disconnectSite}
        >
          <Trans t={t}>Disconnect site</Trans>
        </Button>
      </SiteGroupHeaderActionContainer>

      <VerticalSpaceContainer gap="small">
        <Typography type="body" color="contentBlue">
          {siteTitle}
        </Typography>
      </VerticalSpaceContainer>
    </SiteGroupHeaderContainer>
  );
}
