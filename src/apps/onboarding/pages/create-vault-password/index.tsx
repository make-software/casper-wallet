import React, { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TERMS_URLS } from '@src/constants';

import { Stepper } from '@onboarding/components/stepper';
import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';

import { selectPasswordHash } from '@background/redux/keys/selectors';
import { initKeys } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button, Checkbox, Link, PasswordInputs } from '@libs/ui/components';
import {
  CreatePasswordFormValues,
  useCreatePasswordForm
} from '@libs/ui/forms/create-password';

import { CreateVaultPasswordPageContent } from './content';

interface CreateVaultPasswordPageProps {
  saveIsLoggedIn: (isLoggedIn: boolean) => void;
}

export function CreateVaultPasswordPage({
  saveIsLoggedIn
}: CreateVaultPasswordPageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const passwordHash = useSelector(selectPasswordHash);

  const {
    register,
    handleSubmit,
    formState: { isDirty, isSubmitSuccessful, errors },
    control
  } = useCreatePasswordForm();

  const password = useWatch({
    control,
    name: 'password'
  });

  useEffect(() => {
    if (passwordHash) {
      navigate(RouterPath.CreateSecretPhrase);
    }
  }, [navigate, passwordHash]);

  async function onSubmit(data: CreatePasswordFormValues) {
    dispatchToMainStore(initKeys({ password: data.password }));
    saveIsLoggedIn(true);
  }

  const terms = (
    <Trans t={t}>
      I have read and agree to the{' '}
      <Link
        onClick={event => {
          event.stopPropagation();
          event.preventDefault();
          window.open(TERMS_URLS.tos, '_blank');
        }}
        color="contentAction"
      >
        Casper Wallet Terms of Service
      </Link>{' '}
      and{' '}
      <Link
        onClick={event => {
          event.stopPropagation();
          event.preventDefault();
          window.open(TERMS_URLS.privacy, '_blank');
        }}
        color="contentAction"
      >
        Privacy Policy
      </Link>
      .
    </Trans>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => (
          <TabHeaderContainer>
            <HeaderSubmenuBarNavLink linkType="back" />
            <Stepper length={6} activeIndex={0} />
          </TabHeaderContainer>
        )}
        renderContent={() => (
          <CreateVaultPasswordPageContent>
            <PasswordInputs
              register={register}
              errors={errors}
              passwordLength={password?.length || 0}
            />
          </CreateVaultPasswordPageContent>
        )}
        renderFooter={() => (
          <TabFooterContainer style={{ marginTop: '28px' }}>
            <Checkbox
              checked={isChecked}
              onChange={() => setIsChecked(currentValue => !currentValue)}
              label={terms}
              dataTestId="terms-checkbox"
            />
            <Button disabled={!isChecked || !isDirty || isSubmitSuccessful}>
              <Trans t={t}>Create password</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
