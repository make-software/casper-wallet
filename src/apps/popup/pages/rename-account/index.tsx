import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  InputsContainer,
  SpacingSize
} from '@src/libs/layout';
import { Button, Input, Typography } from '@src/libs/ui';
import {
  RenameAccountFormValues,
  useRenameAccount
} from '@src/libs/ui/forms/rename-account';

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

  function onSubmit({ name }: RenameAccountFormValues) {
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
        <img
          src="assets/illustrations/rename-account.png"
          width={200}
          height={120}
          alt="rename account"
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Rename account</Trans>
        </Typography>
      </ParagraphContainer>
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
