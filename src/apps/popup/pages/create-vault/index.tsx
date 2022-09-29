import React, { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { Trans, useTranslation } from 'react-i18next';
import * as Yup from 'yup';

import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Input,
  InputType,
  InputValidationType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui';
import { vaultCreated } from '@background/redux/vault/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@layout/containers';
import { minPasswordLength } from '@libs/constants';

export function CreateVaultPageContent() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

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
    dispatchToMainStore(vaultCreated({ password: data.password }));

    navigate(RouterPath.Home);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header">
            <Trans t={t}>Create new vault</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Please set a password for your vault. Try to use at least{' '}
              <Typography type="bodySemiBold" color="contentPrimary">
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
      <FooterButtonsAbsoluteContainer>
        <Button disabled={!isDirty}>
          <Trans t={t}>Create Vault</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </form>
  );
}
