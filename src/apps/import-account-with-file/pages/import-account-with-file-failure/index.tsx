import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@layout/containers';
import { Button, Typography } from '@libs/ui';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@import-account-with-file/router';
import { closeWindow } from '@import-account-with-file/utils/close-window';

export function ImportAccountWithFileFailureContentPage() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Something went wrong</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          {state?.importAccountStatusMessage
            ? state.importAccountStatusMessage
            : t("We couldn't import your account. Please try again.")}
        </Typography>
      </TextContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => navigate(RouterPath.ImportAccountWithFile)}>
          <Trans t={t}>Try to import again</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeWindow()}>
          <Trans t={t}>Maybe later</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
