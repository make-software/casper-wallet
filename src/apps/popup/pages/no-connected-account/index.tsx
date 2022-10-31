import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  TextContainer,
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
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Casper Signer is not connected to this site yet</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            To connect to this site, find and click the connect button on the
            site
          </Trans>
        </Typography>
      </TextContainer>

      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => navigate(RouterPath.Home)}>
          <Trans t={t}>Got it</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
