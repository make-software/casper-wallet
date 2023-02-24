import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  IllustrationContainer,
  SpacingSize
} from '@src/libs/layout';
import { SvgIcon, Tag, Typography } from '@libs/ui';

export function ImportAccountWithFileContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/secret-key.svg" size={120} />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.Big}>
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Tag>
          <Trans t={t}>Imported</Trans>
        </Tag>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
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
