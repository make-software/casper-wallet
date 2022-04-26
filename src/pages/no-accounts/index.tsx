import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { ButtonsContainer } from '@src/layout/buttons-container';
import { Typography, Button } from '@src/libs/ui';
import { createAccount as createAccountAction } from '@src/redux/vault/actions';
import { Routes } from '@src/app/routes';
import { Trans, useTranslation } from 'react-i18next';

const Container = styled.div`
  padding: ${({ theme }) => theme.padding[1.6]};
`;

const HeaderContainer = styled.div``;

const TextContainer = styled.div`
  margin-top: 16px;
`;

export function NoAccountsPageContent() {
  const { t } = useTranslation();
  return (
    <Container>
      <HeaderContainer>
        <Typography type="header" weight="semiBold">
          <Trans t={t}>Your vault is ready, but no accounts yet</Trans>
        </Typography>
      </HeaderContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          <Trans t={t}>
            Please, create an account or import an account you already have.
          </Trans>
        </Typography>
      </TextContainer>
    </Container>
  );
}

export function NoAccountsPageFooter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function createAccount() {
    dispatch(createAccountAction({ name: 'First Account' }));
    navigate(Routes.Home);
  }

  return (
    <ButtonsContainer>
      <Button onClick={createAccount}>
        <Trans t={t}>Create Account</Trans>
      </Button>
      <Button color="secondaryBlue">
        <Trans t={t}>Import Account</Trans>
      </Button>
    </ButtonsContainer>
  );
}
