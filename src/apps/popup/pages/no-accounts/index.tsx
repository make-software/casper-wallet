import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { Typography, Button } from '@libs/ui';

import {
  FooterButtonsAbsoluteContainer,
  HeaderTextContainer,
  TextContainer,
  ContentContainer
} from '@src/libs/layout/containers';

export function NoAccountsPageContent() {
  const { t } = useTranslation();
  const { openWindow } = useWindowManager();

  function createAccount() {
    // TODO: Implement `create account with mnemonic phrase` feature
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Your vault is ready, but no accounts yet</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please, create an account or import an account you already have.
          </Trans>
        </Typography>
      </TextContainer>
      <FooterButtonsAbsoluteContainer>
        <Button onClick={createAccount}>
          <Trans t={t}>Create account</Trans>
        </Button>
        <Button
          color="secondaryBlue"
          onClick={() =>
            openWindow({
              purposeForOpening: PurposeForOpening.ImportAccount
            }).catch(e => console.error(e))
          }
        >
          <Trans t={t}>Import account</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
