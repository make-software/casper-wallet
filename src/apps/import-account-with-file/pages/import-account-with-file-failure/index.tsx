import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useTypedNavigate } from '@src/hooks';

import {
  ButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@layout/containers';
import { Button, Typography } from '@libs/ui';

import { useSeparatedWindow } from '@src/hooks';
import { RouterPath } from '@import-account-with-file/paths';

export function ImportAccountWithFileFailureContentPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const { closeWindow } = useSeparatedWindow();

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Something went wrong</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>
            We couldn't import your account. Please try again.
          </Trans>
        </Typography>
      </TextContainer>
      <ButtonsContainer>
        <Button onClick={() => navigate(RouterPath.ImportAccountWithFile)}>
          <Trans t={t}>Try to import again</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeWindow()}>
          <Trans t={t}>Maybe later</Trans>
        </Button>
      </ButtonsContainer>
    </ContentContainer>
  );
}
