import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Button, SvgIcon, Typography } from '@libs/ui/components';

export function NoConnectedAccountPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/no-connection.svg"
          width={200}
          height={120}
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
