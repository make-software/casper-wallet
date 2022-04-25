import React, { FocusEvent, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Button, Input, InputValidationType, Typography } from '@src/libs/ui';
import { ButtonsContainer } from '@src/layout/buttons-container';
import { Routes } from '@src/app/routes';

import { createVault as createVaultAction } from '@src/redux/vault/actions';

import {
  selectConfirmPassword,
  selectFormIsValid,
  selectFormErrors,
  selectPassword
} from './selectors';

import {
  changeConfirmPassword as changeConfirmPasswordAction,
  changePassword as changePasswordAction,
  setFormErrors
} from './actions';

const Container = styled.div`
  height: 454px;
`;

const HeaderTextContainer = styled.div`
  margin-top: 124px;
  padding: 0 16px;
`;

const TextContainer = styled.div`
  margin-top: 16px;
  padding: 0 16px;
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
  const formErrors = useSelector(selectFormErrors);

  const minPasswordLength = 12;

  function changePassword({
    target: { value }
  }: ChangeEvent<HTMLInputElement>) {
    dispatch(changePasswordAction(value));
  }

  function changeConfirmPassword({
    target: { value }
  }: ChangeEvent<HTMLInputElement>) {
    dispatch(changeConfirmPasswordAction(value));
  }

  function validatePassword({
    target: { value }
  }: FocusEvent<HTMLInputElement>) {
    if (value && value.trim().length >= minPasswordLength) {
      dispatch(setFormErrors({ passwordErrorMessage: null }));
    } else {
      dispatch(
        setFormErrors({
          passwordErrorMessage: 'Should be at least 12 characters'
        })
      );
    }
  }

  function validateConfirmPassword({
    target: { value }
  }: FocusEvent<HTMLInputElement>) {
    if (password && value && password === value) {
      dispatch(setFormErrors({ confirmPasswordErrorMessage: null }));
    } else {
      dispatch(
        setFormErrors({ confirmPasswordErrorMessage: "Passwords don't match" })
      );
    }
  }

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
            Please set a password for your vault. Try to use at least{' '}
            <Typography
              type="body"
              weight="semiBold"
              variation="contentPrimary"
            >
              12 characters
            </Typography>{' '}
            to ensure a strong passphrase.
          </Trans>
        </Typography>
      </TextContainer>
      <InputsContainer>
        <Input
          validationType={InputValidationType.Password}
          value={password || ''}
          type="password"
          placeholder={t('Password')}
          onChange={changePassword}
          onBlur={validatePassword}
          error={!!formErrors.passwordErrorMessage}
          validationText={formErrors.passwordErrorMessage}
        />
        <Input
          value={confirmPassword || ''}
          type="password"
          placeholder={t('Confirm password')}
          onChange={changeConfirmPassword}
          onBlur={validateConfirmPassword}
          error={!!formErrors.confirmPasswordErrorMessage}
          validationText={formErrors.confirmPasswordErrorMessage}
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
  const formIsValid = useSelector(selectFormIsValid);

  function createVault() {
    if (!password) {
      return;
    }

    dispatch(changePasswordAction(null));
    dispatch(changeConfirmPasswordAction(null));
    dispatch(createVaultAction({ password }));

    navigate(Routes.createAccount);
  }

  return (
    <ButtonsContainer>
      <Button disabled={!formIsValid} onClick={() => password && createVault()}>
        <Trans t={t}>Create Vault</Trans>
      </Button>
    </ButtonsContainer>
  );
}
