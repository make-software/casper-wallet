import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

import {
  LayoutTab,
  HeaderSubmenuBarNavLink,
  TabFooterContainer
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';
import { useCreatePasswordForm } from '@libs/ui/forms/create-password';

import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { dispatchToMainStore } from '@background/redux/utils';
import { vaultCreated } from '@background/redux/vault/actions';

import { CreateVaultPasswordPageContent } from './content';

export function CreateVaultPasswordPage() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } = useCreatePasswordForm();

  function onSubmit(data: FieldValues) {
    dispatchToMainStore(vaultCreated({ password: data.password }));
    navigate(RouterPath.CreateSecretPhrase);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
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
            <Button disabled={!isChecked || !formState.isDirty}>
              <Trans t={t}>Create password</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
