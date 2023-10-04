import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  ParagraphContainer,
  IllustrationContainer,
  SpacingSize
} from '@src/libs/layout';
import { Button, Typography } from '@src/libs/ui';

import { closeCurrentWindow } from '@src/background/close-current-window';

export function ImportAccountWithFileSuccessContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <img
          src="assets/illustrations/account-imported.png"
          width={200}
          height={120}
          alt="account imported"
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Your account was successfully imported</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Imported accounts are distinguished by an ‘IMPORTED’ badge in the
            account lists.
          </Trans>
        </Typography>
      </ParagraphContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => closeCurrentWindow()}>
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
