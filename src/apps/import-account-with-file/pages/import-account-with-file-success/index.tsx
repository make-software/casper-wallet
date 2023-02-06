import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  ParagraphContainer,
  IllustrationContainer
} from '@src/libs/layout';
import { Button, SvgIcon, Typography } from '@src/libs/ui';

import { closeCurrentWindow } from '@src/background/close-current-window';

export function ImportAccountWithFileSuccessContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/account-imported.svg" size={120} />
      </IllustrationContainer>
      <ParagraphContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Your account was successfully imported</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer gap="medium">
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
