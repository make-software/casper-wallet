import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  TextContainer,
  IllustrationContainer
} from '@src/libs/layout';
import { SvgIcon, Tag, Typography } from '@libs/ui';

export function ImportAccountWithFileContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/secret-key.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Tag>
          <Trans t={t}>Imported</Trans>
        </Tag>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please note, accounts imported with a file cannot be recovered using
            your Casper Wallet secret recovery phrase.
          </Trans>
        </Typography>
      </TextContainer>
    </ContentContainer>
  );
}
