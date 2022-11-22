import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  TextContainer,
  IllustrationContainer
} from '@src/libs/layout';
import { Button, SvgIcon, Typography } from '@src/libs/ui';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@src/apps/import-account-with-file/router';
import { closeActiveWindow } from '@src/background/close-window';

export function ImportAccountWithFileFailureContentPage() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/process-error.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Something went wrong</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          {state?.importAccountStatusMessage
            ? state.importAccountStatusMessage
            : t(
                ': We couldn’t import your account. Please confirm that you’re importing a file containing your secret key (not to be confused with your public key).'
              )}
        </Typography>
      </TextContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => navigate(RouterPath.ImportAccountWithFile)}>
          <Trans t={t}>Try to import again</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeActiveWindow()}>
          <Trans t={t}>Maybe later</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
