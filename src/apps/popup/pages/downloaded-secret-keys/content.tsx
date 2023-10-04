import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@src/libs/layout';
import { Typography } from '@src/libs/ui';

export function DownloadedSecretKeysPageContent() {
  const { t } = useTranslation();
  return (
    <ContentContainer>
      <IllustrationContainer>
        <img
          src="assets/illustrations/key-downloaded.png"
          width={190}
          height={120}
          alt="key downloaded"
        />
      </IllustrationContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Your secret key was downloaded</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Keep your account secret key file safe and secure. Do not share it
            with anyone.
          </Trans>
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
}
