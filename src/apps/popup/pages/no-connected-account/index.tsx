import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  FooterButtonsAbsoluteContainer,
  SpacingSize
} from '@src/libs/layout';
import { Typography, Button } from '@libs/ui';

import { useTypedNavigate, RouterPath } from '@popup/router';

export function NoConnectedAccountPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <img
          src="assets/illustrations/no-connection.png"
          width={200}
          height={120}
          alt="no connection"
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Casper Wallet is not connected to this site yet</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            To connect to this site, click on the Connect/Sign In button on the
            site.
          </Trans>
        </Typography>
      </ParagraphContainer>

      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => navigate(RouterPath.Home)}>
          <Trans t={t}>Got it</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
