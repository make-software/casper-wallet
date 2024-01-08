import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dispatchToMainStore } from '@background/redux/utils';
import { accountRenamed } from '@background/redux/vault/actions';
import { selectVaultAccountsNames } from '@background/redux/vault/selectors';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Button, Input, SvgIcon, Typography } from '@libs/ui';
import {
  RenameAccountFormValues,
  useRenameAccount
} from '@libs/ui/forms/rename-account';

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
        <SvgIcon
          src="assets/illustrations/rename-account.svg"
          width={200}
          height={120}
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
