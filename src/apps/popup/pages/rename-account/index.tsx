import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import * as Yup from 'yup';

import { useFormValidations } from '@src/hooks';

import {
  ButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer
} from '@layout/containers';
import { Button, Input, Typography } from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { renameAccount } from '@popup/redux/vault/actions';
import { selectVaultAccountsNames } from '@popup/redux/vault/selectors';

export function RenameAccountPageContent() {
  const navigate = useTypedNavigate();
  const dispatch = useDispatch();
  const { accountName } = useParams();
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const { createAccountNameValidation } = useFormValidations();

  const formSchema = Yup.object().shape({
    name: createAccountNameValidation(value => {
      return !existingAccountNames.includes(value as string);
    })
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: accountName
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm(formOptions);

  function onSubmit({ name }: FieldValues) {
    if (!accountName) {
      return;
    }

    dispatch(renameAccount({ oldName: accountName, newName: name }));
    navigate(RouterPath.AccountSettings.replace(':accountName', name));
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Rename account</Trans>
        </Typography>
      </HeaderTextContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputsContainer>
          <Input
            type="text"
            placeholder={t('New account name')}
            {...register('name')}
            error={!!errors.name}
            validationText={errors.name?.message}
          />
        </InputsContainer>
        <ButtonsContainer>
          <Button disabled={!isDirty}>
            <Trans t={t}>Update</Trans>
          </Button>
          <Button
            type="button"
            onClick={() => navigate(RouterPath.Home)}
            color="secondaryBlue"
          >
            <Trans t={t}>Cancel</Trans>
          </Button>
        </ButtonsContainer>
      </form>
    </ContentContainer>
  );
}
