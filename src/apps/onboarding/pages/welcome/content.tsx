import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { SvgIcon, Typography } from '@libs/ui';

import {
  PageContainer,
  TextContainer
} from '@src/apps/onboarding/layout/containers';

export function WelcomePageContent() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <SvgIcon src="assets/illustrations/welcome.svg" size={140} />
      <Typography type="header">
        <Trans t={t}>Welcome to Signer! Ready to create your new wallet?</Trans>
      </Typography>

      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            With a Casper Wallet you can send and receive funds, connect to
            Dapps, trade NFTs and so much more!
          </Trans>
        </Typography>
      </TextContainer>
    </PageContainer>
  );
}
