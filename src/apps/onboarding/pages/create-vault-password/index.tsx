import React, { useEffect, useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';
import { useCreatePasswordForm } from '@libs/ui/forms/create-password';

import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { dispatchToMainStore } from '@background/redux/utils';

import { CreateVaultPasswordPageContent } from './content';
import { createEmptyVault } from '@src/background/redux/vault/actions';
import { useSelector } from 'react-redux';
import { selectVaultPasswordHash } from '@src/background/redux/vault/selectors';

interface CreateVaultPasswordPageProps {
  saveIsLoggedIn: (isLoggedIn: boolean) => void;
}

export function CreateVaultPasswordPage({
  saveIsLoggedIn
}: CreateVaultPasswordPageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const vaultPasswordHash = useSelector(selectVaultPasswordHash);

  const { register, handleSubmit, formState } = useCreatePasswordForm();
  const { isDirty, isSubmitSuccessful } = formState;
  useEffect(() => {
    if (vaultPasswordHash) {
      navigate(RouterPath.CreateSecretPhrase);
    }
  }, [navigate, vaultPasswordHash]);

  async function onSubmit(data: FieldValues) {
    dispatchToMainStore(createEmptyVault({ password: data.password }));
    saveIsLoggedIn(true);
  }

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
          <CreateVaultPasswordPageContent
            formState={formState}
            register={register}
          />
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Checkbox
              checked={isChecked}
              onChange={() => setIsChecked(currentValue => !currentValue)}
              label={t(
                'I have read and agree to the Casper Wallet Terms of Service.'
              )}
            />
            <Button
              disabled={!isChecked || !isDirty}
              loading={isSubmitSuccessful}
            >
              <Trans t={t}>Create password</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
