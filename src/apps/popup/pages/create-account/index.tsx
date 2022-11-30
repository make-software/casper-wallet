import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutWindow,
  PopupHeader,
  HeaderSubmenuBarNavLink,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import {
  useCreateAccountForm,
  getDefaultName,
  CreateAccountFormValues
} from '@src/libs/ui/forms/create-account';

import { RouterPath, useTypedNavigate } from '@src/apps/popup/router';

import {
  selectVaultAccountsNames,
  selectVaultDerivedAccounts
} from '@src/background/redux/vault/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';

import { CreateAccountPageContent } from './content';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { createAccount } from '@src/background/redux/sagas/actions';

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
  const onSubmit = ({ name }: CreateAccountFormValues) => {
    const newName = name.trim();
    if (derivedAccounts.find(a => a.name.trim() === newName)) {
      throw Error('Account name exist.');
    }
    dispatchToMainStore(createAccount({ name: newName }));
    navigate(RouterPath.Home);
  };

  const isButtonDisabled = calculateSubmitButtonDisabled({ isValid });

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
