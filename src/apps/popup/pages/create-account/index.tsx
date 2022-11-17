import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

import {
  LayoutWindow,
  PopupHeader,
  HeaderSubmenuBarNavLink,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import {
  useCreateAccountForm,
  getDefaultName
} from '@src/libs/ui/forms/create-account';

import { RouterPath, useTypedNavigate } from '@src/apps/popup/router';

import {
  selectVaultAccountsNames,
  selectVaultDerivedAccounts
} from '@src/background/redux/vault/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountCreated } from '@src/background/redux/vault/actions';

import { CreateAccountPageContent } from './content';
import { getSubmitButtonStateFromValidation } from '@libs/ui/forms/get-submit-button-state-from-validation';

export function CreateAccountPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);
  const derivedAccounts = useSelector(selectVaultDerivedAccounts);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useCreateAccountForm(
    existingAccountNames,
    getDefaultName(derivedAccounts.length, existingAccountNames)
  );
  const onSubmit = ({ name }: FieldValues) => {
    dispatchToMainStore(accountCreated(name.trim()));
    navigate(RouterPath.Home);
  };

  const isButtonDisabled = getSubmitButtonStateFromValidation({ isValid });

  return (
    <LayoutWindow
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <PopupHeader
          withLock
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <CreateAccountPageContent
          register={register}
          errorMessage={errors.name?.message}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button disabled={isButtonDisabled}>
            <Trans t={t}>Create Account</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
