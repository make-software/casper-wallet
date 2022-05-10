import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Button } from '@src/libs/ui';
import { createAccount as createAccountAction } from '@src/redux/vault/actions';
import { RouterPath } from '@src/app/router';

import {
  ButtonsContainer,
  HeaderTextContainer,
  TextContainer,
  ContentContainer
} from '@src/layout/containers';

export function NoAccountsPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function createAccount() {
    dispatch(createAccountAction({ name: 'First Account' }));
    navigate(RouterPath.Home);
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          <Trans t={t}>Your vault is ready, but no accounts yet</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>
            Please, create an account or import an account you already have.
          </Trans>
        </Typography>
      </TextContainer>
      <ButtonsContainer>
        <Button onClick={createAccount}>
          <Trans t={t}>Create account</Trans>
        </Button>
        <Button color="secondaryBlue">
          <Trans t={t}>Import account</Trans>
        </Button>
      </ButtonsContainer>
    </ContentContainer>
  );
}
