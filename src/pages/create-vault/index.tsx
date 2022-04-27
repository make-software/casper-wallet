import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { FieldValues, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import {
  Button,
  Input,
  InputValidationType,
  SvgIcon,
  Typography
} from '@src/libs/ui';
import { ContentContainer } from '@src/layout/content-container';
import { ButtonsContainer } from '@src/layout/buttons-container';
import { Routes } from '@src/app/routes';

import { createVault as createVaultAction } from '@src/redux/vault/actions';

type InputType = 'password' | 'text';

const HeaderTextContainer = styled.div`
  padding: 0 16px;
  margin-top: 24px;
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
  const navigate = useNavigate();

  const minPasswordLength = 12;

  const passwordAmountCharactersMessage = `${t(
    'Should be at least'
  )} ${minPasswordLength} ${t('characters')}`;

  const passwordsDoesntMatchMessage = t("Passwords don't match");

  const formSchema = Yup.object().shape({
    password: Yup.string().min(
      minPasswordLength,
      passwordAmountCharactersMessage
    ),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref('password')],
      passwordsDoesntMatchMessage
    )
  });

  const formOptions = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
    //@ts-ignore
  } = useForm(formOptions);

  const [passwordInputType, setPasswordInputType] =
    useState<InputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<InputType>('password');

  const onSubmit = (data: FieldValues) => {
    dispatch(createVaultAction({ password: data.password }));
    navigate(Routes.NoAccounts);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ContentContainer>
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
            <Typography
              type="body"
              weight="semiBold"
              variation="contentPrimary"
            >
              {minPasswordLength} <Trans t={t}>characters</Trans>
            </Typography>
            <Trans t={t}>to ensure a strong passphrase.</Trans>
          </Typography>
        </TextContainer>
        <InputsContainer>
          <Input
            validationType={InputValidationType.Password}
            type={passwordInputType}
            placeholder={t('Password')}
            oneColoredIcons
            suffixIcon={
              <PasswordVisibilityIcon
                inputType={passwordInputType}
                changeInputType={setPasswordInputType}
              />
            }
            {...register('password')}
            error={!!errors.password}
            validationText={errors.password?.message}
          />
          <Input
            type={confirmPasswordInputType}
            placeholder={t('Confirm password')}
            oneColoredIcons
            suffixIcon={
              <PasswordVisibilityIcon
                inputType={confirmPasswordInputType}
                changeInputType={setConfirmPasswordInputType}
              />
            }
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            validationText={errors.confirmPassword?.message}
          />
        </InputsContainer>
      </ContentContainer>
      <ButtonsContainer>
        <Button disabled={!isDirty}>
          <Trans t={t}>Create Vault</Trans>
        </Button>
      </ButtonsContainer>
    </form>
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
          src="assets/icons/hide.svg"
          size={20}
        />
      </InputIconContainer>
    );
  }

  return (
    <InputIconContainer>
      <SvgIcon
        onClick={() => changeInputType('password')}
        src="assets/icons/show.svg"
        size={20}
      />
    </InputIconContainer>
  );
}
