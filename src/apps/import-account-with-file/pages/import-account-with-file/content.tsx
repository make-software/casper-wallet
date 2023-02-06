import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
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
      <ParagraphContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer gap="medium">
        <Tag>
          <Trans t={t}>Imported</Trans>
        </Tag>
      </ParagraphContainer>
      <ParagraphContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please note, accounts imported with a file cannot be recovered using
            your Casper Wallet secret recovery phrase.
          </Trans>
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
}
