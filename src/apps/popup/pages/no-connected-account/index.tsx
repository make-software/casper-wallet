import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  FooterButtonsAbsoluteContainer
} from '@src/libs/layout';
import { Typography, SvgIcon, Button } from '@libs/ui';

import { useTypedNavigate, RouterPath } from '@popup/router';

export function NoConnectedAccountPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/no-connection.svg" size={120} />
      </IllustrationContainer>
      <ParagraphContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Casper Wallet is not connected to this site yet</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer gap="medium">
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
