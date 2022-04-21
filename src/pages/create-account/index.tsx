import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { ButtonsContainer } from '@src/layout/buttons-container';
import { Typography, Button } from '@src/libs/ui';
import { createAccount } from '@src/redux/vault/actions';
import { Routes } from '@src/app/routes';
import { Trans, useTranslation } from 'react-i18next';

const Container = styled.div`
  height: 396px;
  padding: ${({ theme }) => theme.padding[1.6]};
`;

const HeaderContainer = styled.div`
  margin-top: 128px;
`;

const TextContainer = styled.div`
  margin-top: 16px;
`;

export function CreateAccountPageContent() {
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
            Please, create an account or import account you already have.
          </Trans>
        </Typography>
      </TextContainer>
    </Container>
  );
}

export function CreateAccountPageFooter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function createFirstAccount() {
    dispatch(createAccount({ accountName: 'First Account' }));
    navigate(Routes.home);
  }

  return (
    <ButtonsContainer>
      <Button onClick={createFirstAccount}>
        <Trans t={t}>Create Account</Trans>
      </Button>
      <Button color="secondaryBlue">
        <Trans t={t}>Import Account</Trans>
      </Button>
    </ButtonsContainer>
  );
}
