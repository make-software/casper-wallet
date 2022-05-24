import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@layout/containers';
import { Button, Typography } from '@libs/ui';
import { useSeparatedWindow } from '@src/hooks';

export function ImportAccountWithFileSuccessContentPage() {
  const { t } = useTranslation();
  const { closeWindow } = useSeparatedWindow();

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
      <ButtonsContainer>
        <Button onClick={() => closeWindow()}>
          <Trans t={t}>Done</Trans>
        </Button>
      </ButtonsContainer>
    </ContentContainer>
  );
}
