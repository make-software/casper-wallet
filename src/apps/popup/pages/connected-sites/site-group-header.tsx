import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { Button, Typography } from '@src/libs/ui';
import {
  AlignedSpaceBetweenFlexRow,
  SpaceBetweenFlexColumn,
  SpacingSize,
  VerticalSpaceContainer
} from '@src/libs/layout';

const SiteGroupHeaderContainer = styled(SpaceBetweenFlexColumn)`
  padding: ${({ theme }) => theme.padding[1.6]};
`;

const SiteGroupHeaderActionContainer = styled(AlignedSpaceBetweenFlexRow)``;

interface SiteGroupHeaderProps {
  siteTitle: string | undefined;
  siteOrigin: string;
  siteOrder: number;
  disconnectSite: () => void;
}

export function SiteGroupHeader({
  siteTitle,
  siteOrigin,
  siteOrder,
  disconnectSite
}: SiteGroupHeaderProps) {
  const { t } = useTranslation();

  return (
    <SiteGroupHeaderContainer>
      <SiteGroupHeaderActionContainer>
        <Typography type="bodySemiBold" color="contentPrimary">
          {siteTitle || (
            <>
              <Trans t={t}>Site</Trans> {siteOrder}
            </>
          )}
        </Typography>

        <Button
          minWidth="100"
          inline
          color="primaryRed"
          onClick={disconnectSite}
        >
          <Trans t={t}>Disconnect</Trans>
        </Button>
      </SiteGroupHeaderActionContainer>

      <VerticalSpaceContainer top={SpacingSize.Small}>
        <Typography type="body" color="contentBlue">
          {siteOrigin}
        </Typography>
      </VerticalSpaceContainer>
    </SiteGroupHeaderContainer>
  );
}
