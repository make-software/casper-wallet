import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  ParagraphContainer,
  IllustrationContainer,
  SpacingSize
} from '@src/libs/layout';
import { Button, SvgIcon, Typography } from '@src/libs/ui';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@src/apps/import-account-with-file/router';
import { closeCurrentWindow } from '@src/background/close-current-window';

export function ImportAccountWithFileFailureContentPage() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/error.svg" size={120} />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Something went wrong</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          {state?.importAccountStatusMessage
            ? state.importAccountStatusMessage
            : t(
                ': We couldn’t import your account. Please confirm that you’re importing a file containing your secret key (not to be confused with your public key).'
              )}
        </Typography>
      </ParagraphContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => navigate(RouterPath.ImportAccountWithFile)}>
          <Trans t={t}>Try to import again</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeCurrentWindow()}>
          <Trans t={t}>Maybe later</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
