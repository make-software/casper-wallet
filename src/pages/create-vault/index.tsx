import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Input, Button } from '@src/libs/ui';
import { ButtonsContainer } from '@src/layout/buttons-container';
import { Routes } from '@src/app/routes';

import { createVault as createVaultAction } from '@src/redux/vault/actions';

import {
  selectPassword,
  selectConfirmPassword,
  selectButtonIsEnabled
} from './selectors';
import {
  changePassword,
  changeConfirmPassword,
  enableButton,
  disableButton
} from './actions';

const Container = styled.div`
  height: 454px;
`;

const HeaderTextContainer = styled.div`
  margin-top: 144px;
`;

const TextContainer = styled.div`
  margin-top: 16px;
`;

const InputsContainer = styled.div`
  margin-top: 24px;
  & > div:nth-child(2) {
    margin-top: 16px;
  }
`;

export function CreateVaultPageContent() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const password = useSelector(selectPassword);
  const confirmPassword = useSelector(selectConfirmPassword);

  return (
    <Container>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          <Trans t={t}>Create new vault</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          <Trans t={t}>
            Please set a password for your vault. You will need it later to
            unlock it, so keep it safe.
          </Trans>
        </Typography>
      </TextContainer>
      <InputsContainer>
        <Input
          value={password}
          type="password"
          placeholder={t('Password')}
          onChange={({ target: { value } }) =>
            dispatch(changePassword({ password: value }))
          }
        />
        <Input
          value={confirmPassword}
          type="password"
          placeholder={t('Confirm password')}
          onChange={({ target: { value } }) =>
            dispatch(changeConfirmPassword({ password: value }))
          }
        />
      </InputsContainer>
    </Container>
  );
}

export function CreateVaultPageFooter() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const password = useSelector(selectPassword);
  const confirmPassword = useSelector(selectConfirmPassword);
  const buttonIsEnabled = useSelector(selectButtonIsEnabled);

  useEffect(() => {
    if (
      password?.trim() &&
      confirmPassword?.trim() &&
      password === confirmPassword
    ) {
      dispatch(enableButton());
    } else {
      dispatch(disableButton());
    }
  }, [password, confirmPassword, dispatch]);

  function createVault(password: string) {
    dispatch(changePassword({ password: '' }));
    dispatch(changeConfirmPassword({ password: '' }));
    dispatch(disableButton());
    dispatch(createVaultAction({ password }));
    navigate(Routes.createAccount);
  }

  return (
    <ButtonsContainer>
      <Button
        disabled={!buttonIsEnabled}
        onClick={() => password && createVault(password)}
      >
        <Trans t={t}>Create Vault</Trans>
      </Button>
    </ButtonsContainer>
  );
}
