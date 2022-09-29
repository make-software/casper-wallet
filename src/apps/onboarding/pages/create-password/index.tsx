import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

import { HeaderSubmenuBarNavLink } from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';
import { useCreatePasswordForm } from '@libs/forms/create-password';

import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';
import { FooterContainer } from '@onboarding/layout/containers';
import { Layout } from '@onboarding/layout';

import { CreatePasswordPageContent } from './content';

import { dispatchToMainStore } from '@background/redux/utils';
import { vaultCreated } from '@background/redux/vault/actions';

export function CreatePasswordPage() {
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
      <Layout
        renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
        renderContent={() => (
          <CreatePasswordPageContent
            formState={formState}
            register={register}
          />
        )}
        contentBackgroundColor="backgroundSecondary"
        renderFooter={() => (
          <FooterContainer>
            <Checkbox
              checked={isChecked}
              onChange={() => setIsChecked(currentValue => !currentValue)}
              label={t('I have read and agreed to the Terms of Use')}
            />
            <Button disabled={!isChecked || !formState.isDirty}>
              <Trans t={t}>Create password</Trans>
            </Button>
          </FooterContainer>
        )}
      />
    </form>
  );
}