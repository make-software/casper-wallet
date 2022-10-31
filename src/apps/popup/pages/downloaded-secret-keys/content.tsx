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
          <Trans t={t}>Your keys were downloaded</Trans>
        </Typography>
      </TextContainer>

      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>Please keep them safe and secure.</Trans>
        </Typography>
      </TextContainer>
    </ContentContainer>
  );
}
