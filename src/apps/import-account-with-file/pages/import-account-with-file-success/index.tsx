import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/libs/layout/containers';
import { Button, Typography } from '@libs/ui';
import { closeWindow } from '@import-account-with-file/utils/close-window';

export function ImportAccountWithFileSuccessContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Your account was successfully imported</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>Now you can see it in your accounts list.</Trans>
        </Typography>
      </TextContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => closeWindow()}>
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
