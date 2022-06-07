import React, { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import * as Yup from 'yup';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Input,
  InputValidationType,
  SvgIcon,
  Typography
} from '@libs/ui';
import { createVault } from '@popup/redux/vault/actions';
import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  FooterButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@src/layout/containers';

type InputType = 'password' | 'text';

export function CreateVaultPageContent() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useTypedNavigate();

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

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm(formOptions);

  const [passwordInputType, setPasswordInputType] =
    useState<InputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<InputType>('password');

  function onSubmit(data: FieldValues) {
    dispatch(createVault({ password: data.password }));

    navigate(RouterPath.NoAccounts);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header" weight="semiBold">
            <Trans t={t}>Create new vault</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" weight="regular" color="contentSecondary">
            <Trans t={t}>
              Please set a password for your vault. Try to use at least{' '}
              <Typography type="body" weight="semiBold" color="contentPrimary">
                {{ minPasswordLength }} characters
              </Typography>{' '}
              to ensure a strong passphrase.
            </Trans>
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
      <FooterButtonsContainer>
        <Button disabled={!isDirty}>
          <Trans t={t}>Create Vault</Trans>
        </Button>
      </FooterButtonsContainer>
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
