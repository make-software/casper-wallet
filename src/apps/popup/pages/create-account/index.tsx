import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { createAccount } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  selectVaultAccountsNames,
  selectVaultDerivedAccounts
} from '@background/redux/vault/selectors';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';
import {
  CreateAccountFormValues,
  getDefaultName,
  useCreateAccountForm
} from '@libs/ui/forms/create-account';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

import { CreateAccountPageContent } from './content';

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

  const handleGoBackHome = () => navigate(RouterPath.Home);

  const isButtonDisabled = calculateSubmitButtonDisabled({ isValid });

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
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
          <Button
            type="button"
            onClick={handleGoBackHome}
            color="secondaryBlue"
          >
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
