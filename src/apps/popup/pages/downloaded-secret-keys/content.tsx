import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  TextContainer
} from '@src/libs/layout';
import { SvgIcon, Typography } from '@src/libs/ui';

export function DownloadedSecretKeysPageContent() {
  const { t } = useTranslation();
  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/keys-downloaded.svg" size={120} />
      </IllustrationContainer>

      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Your secret key was downloaded</Trans>
        </Typography>
      </TextContainer>

      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Keep your account secret key file safe and secure. Do not share it
            with anyone.
          </Trans>
        </Typography>
      </TextContainer>
    </ContentContainer>
  );
}
