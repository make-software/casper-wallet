import React, { useState, FocusEvent, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import {
  Button,
  Input,
  InputValidationType,
  SvgIcon,
  Typography
} from '@src/libs/ui';
import { ButtonsContainer } from '@src/layout/buttons-container';
import { Routes } from '@src/app/routes';

import { createVault as createVaultAction } from '@src/redux/vault/actions';

import {
  selectConfirmPassword,
  selectFormIsValid,
  selectFormErrors,
  selectPassword
} from '@src/redux/substores/create-vault/selectors';

import {
  changeConfirmPassword as changeConfirmPasswordAction,
  changePassword as changePasswordAction,
  setFormErrors
} from '@src/redux/substores/create-vault/actions';

import { minPasswordLength, passwordIsValid } from './validation';

type InputType = 'password' | 'text';

const Container = styled.div``;

const HeaderTextContainer = styled.div`
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

  const [passwordInputType, setPasswordInputType] =
    useState<InputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<InputType>('password');

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
    if (passwordIsValid(value)) {
      dispatch(setFormErrors({ passwordErrorMessage: null }));
    } else {
      const message = `${t('Should be at least')} ${minPasswordLength} ${t(
        'characters'
      )}`;

      dispatch(
        setFormErrors({
          passwordErrorMessage: message
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
        setFormErrors({
          confirmPasswordErrorMessage: t("Passwords don't match")
        })
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
            Please set a password for your vault. Try to use at least
          </Trans>{' '}
          <Typography type="body" weight="semiBold" variation="contentPrimary">
            {minPasswordLength} <Trans t={t}>characters</Trans>
          </Typography>
          <Trans t={t}>to ensure a strong passphrase.</Trans>
        </Typography>
      </TextContainer>
      <InputsContainer>
        <Input
          validationType={InputValidationType.Password}
          value={password || ''}
          type={passwordInputType}
          placeholder={t('Password')}
          onChange={changePassword}
          onBlur={validatePassword}
          error={!!formErrors.passwordErrorMessage}
          validationText={formErrors.passwordErrorMessage}
          oneColoredIcons
          suffixIcon={
            <PasswordVisibilityIcon
              inputType={passwordInputType}
              changeInputType={setPasswordInputType}
            />
          }
        />
        <Input
          value={confirmPassword || ''}
          type={confirmPasswordInputType}
          placeholder={t('Confirm password')}
          onChange={changeConfirmPassword}
          onBlur={validateConfirmPassword}
          error={!!formErrors.confirmPasswordErrorMessage}
          validationText={formErrors.confirmPasswordErrorMessage}
          oneColoredIcons
          suffixIcon={
            <PasswordVisibilityIcon
              inputType={confirmPasswordInputType}
              changeInputType={setConfirmPasswordInputType}
            />
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

interface PasswordVisibilityIconProps {
  inputType: InputType;
  changeInputType: (type: InputType) => void;
}

const InputIconContainer = styled.div`
  line-height: 1rem;
`;

function PasswordVisibilityIcon({
  inputType,
  changeInputType
}: PasswordVisibilityIconProps) {
  if (inputType === 'password') {
    return (
      <InputIconContainer>
        <SvgIcon
          onClick={() => changeInputType('text')}
          src="assets/icons/show.svg"
          size={20}
        />
      </InputIconContainer>
    );
  }

  return (
    <InputIconContainer>
      <SvgIcon
        onClick={() => changeInputType('password')}
        src="assets/icons/hide.svg"
        size={20}
      />
    </InputIconContainer>
  );
}
