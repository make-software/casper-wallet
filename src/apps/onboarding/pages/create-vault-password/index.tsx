import React, { Dispatch, SetStateAction, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

import {
  LayoutTab,
  TabHeaderContainer,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';
import { useCreatePasswordForm } from '@libs/ui/forms/create-password';

import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { setSessionLoginStatus } from '@src/apps/onboarding/utils/session-login-status';
import { Stepper } from '@src/apps/onboarding/components/stepper';

import { dispatchToMainStore } from '@background/redux/utils';
import { vaultCreated } from '@background/redux/vault/actions';

import { CreateVaultPasswordPageContent } from './content';

interface CreateVaultPasswordPageProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export function CreateVaultPasswordPage({
  setIsLoggedIn
}: CreateVaultPasswordPageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } = useCreatePasswordForm();
  const { isDirty } = formState;

  function onSubmit(data: FieldValues) {
    setSessionLoginStatus(true);
    setIsLoggedIn(true);
    dispatchToMainStore(vaultCreated({ password: data.password }));
    navigate(RouterPath.CreateSecretPhrase);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => (
          <TabHeaderContainer>
            <HeaderSubmenuBarNavLink linkType="back" />
            <Stepper steps={6} step={1} />
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
              label={t('I have read and agreed to the Terms of Use')}
            />
            <Button disabled={!isChecked || !isDirty}>
              <Trans t={t}>Create password</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
