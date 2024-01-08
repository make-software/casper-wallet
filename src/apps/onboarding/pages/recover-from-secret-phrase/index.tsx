import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Stepper } from '@onboarding/components/stepper';
import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';
import { closeActiveTab } from '@onboarding/utils/close-active-tab';

import { initVault } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { validateSecretPhrase } from '@libs/crypto';
import {
  ErrorPath,
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer,
  createErrorLocationState
} from '@libs/layout';
import { Button } from '@libs/ui';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import {
  RecoverSecretPhraseFormValues,
  useRecoverFromSecretPhraseForm
} from '@libs/ui/forms/recover-from-secret-phrase';

import { RecoverFromSecretPhrasePageContent } from './content';

export function RecoverFromSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } =
    useRecoverFromSecretPhraseForm();
  const { isDirty } = formState;

  function onSubmit({ phrase }: RecoverSecretPhraseFormValues) {
    try {
      const secretPhrase = phrase.trim().split(' ');
      if (!validateSecretPhrase(secretPhrase)) {
        throw Error('Invalid secret phrase.');
      }
      dispatchToMainStore(initVault({ secretPhrase }));
      closeActiveTab();
    } catch (err) {
      console.error(err);
      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: t('Import of Secret Recovery Phrase failed'),
          errorContentText: t(
            'Confirm that you are using a Casper Wallet secret recovery phrase, and that you typed each word correctly and in the correct order.'
          ),
          errorPrimaryButtonLabel: t('Try again'),
          errorRedirectPath: RouterPath.RecoverFromSecretPhrase
        })
      );
    }
  }

  const submitButtonDisabled = calculateSubmitButtonDisabled({
    isDirty
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withStepper"
        renderHeader={() => (
          <TabHeaderContainer>
            <HeaderSubmenuBarNavLink
              linkType="back"
              onClick={() => navigate(RouterPath.CreateSecretPhrase)}
            />
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
            <Button disabled={submitButtonDisabled}>
              <Trans t={t}>Recover my wallet</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
