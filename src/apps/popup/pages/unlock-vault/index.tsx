import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { RouterPath } from '@popup/router';

import {
  ContentContainer,
  ButtonsContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@layout/containers';
import { Typography, Input, Button } from '@libs/ui';

import { selectVaultPassword } from '@libs/redux/vault/selectors';
import { unlockVault } from '@libs/redux/vault/actions';

export function UnlockVaultPageContent() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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
    dispatch(unlockVault());
    navigate(-1);
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
      <ButtonsContainer>
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
      </ButtonsContainer>
    </form>
  );
}
