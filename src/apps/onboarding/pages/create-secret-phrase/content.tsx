import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Typography } from '@libs/ui';

import { PageContainer, TextContainer } from '@onboarding/layout/containers';

export function CreateSecretPhraseContent() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <Typography type="header">
        <Trans t={t}>Create secret phrase</Trans>
      </Typography>
      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Casper Signer doesn’t have a “Reset password” feature. All you get
            is a secret phrase, which makes it easy to back up and restore your
            account.
          </Trans>
        </Typography>
      </TextContainer>
    </PageContainer>
  );
}
