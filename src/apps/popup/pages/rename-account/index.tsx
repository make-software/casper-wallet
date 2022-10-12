import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import * as Yup from 'yup';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer
} from '@src/libs/layout/containers';
import { Button, Input, Typography } from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { accountRenamed } from '@src/background/redux/vault/actions';
import { selectVaultAccountsNames } from '@src/background/redux/vault/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { useAccountNameIsTakenRule } from '@src/libs/ui/forms/form-validation-rules';

export function RenameAccountPageContent() {
  const navigate = useTypedNavigate();
  const { accountName } = useParams();
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const formSchema = Yup.object().shape({
    name: useAccountNameIsTakenRule(value => {
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

    dispatchToMainStore(
      accountRenamed({ oldName: accountName, newName: name })
    );
    navigate(RouterPath.AccountSettings.replace(':accountName', name));
  }

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header">
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
        <FooterButtonsAbsoluteContainer>
          <Button disabled={!isDirty}>
            <Trans t={t}>Update</Trans>
          </Button>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            color="secondaryBlue"
          >
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsAbsoluteContainer>
      </form>
    </ContentContainer>
  );
}
