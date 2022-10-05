import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';
import { useRecoverFromSecretPhraseForm } from '@libs/ui/forms/recover-from-secret-phrase';

import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';
import { closeActiveTab } from '@src/apps/onboarding/utils/closeActiveTab';

import { RecoverFromSecretPhrasePageContent } from './content';
import { FieldValues } from 'react-hook-form';

export function RecoverFromSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } =
    useRecoverFromSecretPhraseForm();
  const { isDirty } = formState;

  function onSubmit({ phrase }: FieldValues) {
    if (phrase === mockedMnemonicPhrase.join(' ')) {
      closeActiveTab().catch(e => console.error(e));
    } else {
      navigate(RouterPath.OnboardingError, {
        state: {
          errorHeaderText: t(
            'We can’t connect your wallet with this secret phrase'
          ),
          errorContentText: t(
            'It could be you’ve made a mistake while entering it. Please try again.'
          ),
          errorPrimaryButtonLabel: t('Try again')
        }
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
        renderContent={() => (
          <RecoverFromSecretPhrasePageContent
            register={register}
            formState={formState}
          />
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button disabled={!isDirty}>
              <Trans t={t}>Connect to my wallet</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
