import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  IllustrationContainer
} from '@src/libs/layout';
import { Button, SvgIcon, Typography } from '@src/libs/ui';

import { closeActiveWindow } from '@src/background/close-window';

export function ImportAccountWithFileSuccessContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/account-imported.svg" size={120} />
      </IllustrationContainer>
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Your account was successfully imported</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>Now you can see it in your accounts list.</Trans>
        </Typography>
      </TextContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => closeActiveWindow()}>
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
