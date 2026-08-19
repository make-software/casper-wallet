import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { fetchSuggestedAccountName } from '@background/handlers/vault-secrets';
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
  PopupLayout,
  PrivateStateErrorPage,
  PrivateStateLoadingPage
} from '@libs/layout';
import { requestWithRetry } from '@libs/messaging/request-with-retry';
import { Button } from '@libs/ui/components';
import {
  CreateAccountFormValues,
  useCreateAccountForm
} from '@libs/ui/forms/create-account';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

import { CreateAccountPageContent } from './content';

interface CreateAccountFormProps {
  suggestedName: string;
}

// Split out because react-hook-form reads `defaultValues` once at mount, so
// the form can only be mounted once the suggested name has resolved.
function CreateAccountForm({ suggestedName }: CreateAccountFormProps) {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);
  const derivedAccounts = useSelector(selectVaultDerivedAccounts);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useCreateAccountForm(existingAccountNames, suggestedName);

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

export function CreateAccountPage() {
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchAttemptId, setFetchAttemptId] = useState(0);

  useEffect(() => {
    let mounted = true;
    setError(false);
    setIsLoading(true);

    requestWithRetry(fetchSuggestedAccountName)
      .then(name => {
        if (mounted) {
          // A refusal (locked / wrong page) answers null — treat it as a
          // failure rather than rendering an empty page forever.
          name == null ? setError(true) : setSuggestedName(name);
        }
      })
      .catch(() => mounted && setError(true))
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [fetchAttemptId]);

  const retry = useCallback(() => setFetchAttemptId(id => id + 1), []);

  if (error) {
    return <PrivateStateErrorPage layout="popup" onRetry={retry} />;
  }

  if (isLoading) {
    return <PrivateStateLoadingPage />;
  }

  if (suggestedName == null) {
    return null;
  }

  return <CreateAccountForm suggestedName={suggestedName} />;
}
