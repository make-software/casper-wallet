import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useWatch } from 'react-hook-form';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button, Checkbox, Link, PasswordInputs } from '@libs/ui';
import {
  CreatePasswordFormValues,
  useCreatePasswordForm
} from '@libs/ui/forms/create-password';

import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { selectPasswordHash } from '@src/background/redux/keys/selectors';
import { initKeys } from '@src/background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';
import { TermsLink } from '@src/constants';

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
          window.open(TermsLink.Tos, '_blank');
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
          window.open(TermsLink.Privacy, '_blank');
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
          <TabFooterContainer>
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
