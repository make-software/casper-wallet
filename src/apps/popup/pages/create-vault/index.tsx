import React, { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import * as Yup from 'yup';
import { RouterPath, useTypedNavigate } from '~src/apps/popup/router';
import { dispatchToMainStore } from '~src/libs/redux/utils';
import { vaultCreated } from '~src/libs/redux/vault/actions';
import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '~src/libs/layout';
import {
  Button,
  Input,
  InputValidationType,
  SvgIcon,
  Typography
} from '~src/libs/ui';

import { yupResolver } from '@hookform/resolvers/yup';

type InputType = 'password' | 'text';

export function CreateVaultPageContent() {
  const { t } = useTranslation();
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
    dispatchToMainStore(vaultCreated({ password: data.password }));

    navigate(RouterPath.Home);
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
      <FooterButtonsAbsoluteContainer>
        <Button disabled={!isDirty}>
          <Trans t={t}>Create Vault</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
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
