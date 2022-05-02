import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import {
  ContentContainer,
  ButtonsContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@src/layout/containers';
import { Typography, Input, Button } from '@src/libs/ui';

import { selectVaultPassword } from '@src/redux/vault/selectors';
import { startTimeout, unlockVault } from '@src/redux/vault/actions';

export function UnlockVaultPageContent() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const vaultPassword = useSelector(selectVaultPassword);

  const errorMessage = t('Password is not correct');
  const formSchema = Yup.object().shape({
    password: Yup.string().equals([vaultPassword], errorMessage)
  });

  const formOptions = {
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
    //@ts-ignore TODO: fix type for `reValidateMode`
  } = useForm(formOptions);

  function unlockVaultHandle({ password }: FieldValues) {
    navigate(-1);
    dispatch(unlockVault());
    dispatch(startTimeout({ timeoutStartTime: Date.now() }));
  }

  return (
    <form onSubmit={handleSubmit(unlockVaultHandle)}>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            <Trans t={t}>Your vault is locked</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" weight="regular" variation="contentSecondary">
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
        <Button type="button" color="secondaryRed">
          {t('Reset vault')}
        </Button>
      </ButtonsContainer>
    </form>
  );
}
