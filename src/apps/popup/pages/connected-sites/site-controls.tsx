import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { Button, Typography } from '@libs/ui';

const SiteControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: ${({ theme }) => theme.padding[1.6]};
`;

interface SiteControlsProps {
  siteTitle: string;
  disconnectSite: () => void;
}

export function SiteControls({ siteTitle, disconnectSite }: SiteControlsProps) {
  const { t } = useTranslation();

  return (
    <SiteControlsContainer>
      <Typography type="body" color="contentBlue" weight="regular">
        {siteTitle}
      </Typography>

      <Button
        width="120"
        variant="inline"
        color="primaryRed"
        onClick={disconnectSite}
      >
        <Trans t={t}>Disconnect site</Trans>
      </Button>
    </SiteControlsContainer>
  );
}
