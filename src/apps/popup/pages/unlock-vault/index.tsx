import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { RouterPath } from '~src/apps/popup/router';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '~src/libs/layout/containers';
import { Typography, Input, Button } from '~src/libs/ui';

import { selectVaultPassword } from '~src/libs/redux/vault/selectors';
import { vaultUnlocked } from '~src/libs/redux/vault/actions';
import { dispatchToMainStore } from '../../../../libs/redux/utils';

export function UnlockVaultPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const vaultPassword = useSelector(selectVaultPassword);

  const errorMessage = t('Password is not correct');
  const formSchema = Yup.object().shape({
    password: Yup.string().equals([vaultPassword], errorMessage)
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  });

  function handleUnlockVault() {
    dispatchToMainStore(vaultUnlocked());
  }

  return (
    <form onSubmit={handleSubmit(handleUnlockVault)}>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            <Trans t={t}>Your vault is locked</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" weight="regular" color="contentSecondary">
            <Trans t={t}>Please enter the password to unlock.</Trans>
          </Typography>
        </TextContainer>
        <InputsContainer>
          <Input
            type="password"
            placeholder={t('Password')}
            error={!!errors.password}
            validationText={errors.password?.message}
            {...register('password')}
          />
        </InputsContainer>
      </ContentContainer>
      <FooterButtonsAbsoluteContainer>
        <Button disabled={!isDirty} type="submit">
          {t('Unlock vault')}
        </Button>
        <Button
          type="button"
          color="secondaryRed"
          onClick={() => navigate(RouterPath.ResetVault)}
        >
          {t('Reset vault')}
        </Button>
      </FooterButtonsAbsoluteContainer>
    </form>
  );
}
