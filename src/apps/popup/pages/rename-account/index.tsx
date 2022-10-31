import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FieldValues } from 'react-hook-form';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  IllustrationContainer,
  TextContainer,
  InputsContainer
} from '@src/libs/layout';
import { Button, Input, SvgIcon, Typography } from '@src/libs/ui';
import { useRenameAccount } from '@src/libs/ui/forms/rename-account';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { accountRenamed } from '@src/background/redux/vault/actions';
import { selectVaultAccountsNames } from '@src/background/redux/vault/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';

export function RenameAccountPageContent() {
  const navigate = useTypedNavigate();
  const { accountName } = useParams();
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useRenameAccount(accountName, existingAccountNames);

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
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/rename-account.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Rename account</Trans>
        </Typography>
      </TextContainer>
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
