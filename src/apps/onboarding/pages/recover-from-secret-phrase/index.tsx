import React from 'react';
import { FieldValues } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button } from '@libs/ui';
import { useRecoverFromSecretPhraseForm } from '@libs/ui/forms/recover-from-secret-phrase';
import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { closeActiveTab } from '@src/apps/onboarding/utils/close-active-tab';

import { RecoverFromSecretPhrasePageContent } from './content';
import { initializeWalletWithPhrase } from '../../hooks/initialize-wallet';

export function RecoverFromSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } =
    useRecoverFromSecretPhraseForm();
  const { isDirty } = formState;

  function onSubmit({ phrase }: FieldValues) {
    try {
      initializeWalletWithPhrase((phrase as string).split(' '));
      closeActiveTab();
    } catch (err) {
      console.error(err);
      navigate(RouterPath.OnboardingError, {
        state: {
          errorHeaderText: t(
            'We can’t connect your wallet with this secret phrase'
          ),
          errorContentText: t(
            'It could be you’ve made a mistake while entering it. Please try again.'
          ),
          errorPrimaryButtonLabel: t('Try again'),
          errorRedirectPath: RouterPath.RecoverFromSecretPhrase
        }
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => (
          <TabHeaderContainer>
            <HeaderSubmenuBarNavLink linkType="back" />
            <Stepper length={3} activeIndex={2} />
          </TabHeaderContainer>
        )}
        renderContent={() => (
          <RecoverFromSecretPhrasePageContent
            register={register}
            errorMessage={formState.errors?.phrase?.message}
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
