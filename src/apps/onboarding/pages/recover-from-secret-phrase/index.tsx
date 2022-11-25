import React from 'react';
import { FieldValues } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@src/libs/layout';
import { createErrorLocationState, ErrorPath } from '@src/libs/layout/error';
import { Button } from '@src/libs/ui';
import { useRecoverFromSecretPhraseForm } from '@src/libs/ui/forms/recover-from-secret-phrase';

import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { closeActiveTab } from '@src/apps/onboarding/utils/close-active-tab';

import { RecoverFromSecretPhrasePageContent } from './content';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { calculateSubmitButtonDisabled } from '@src/libs/ui/forms/get-submit-button-state-from-validation';
import { validateSecretPhrase } from '@src/libs/crypto';
import { initVault } from '@src/background/redux/sagas/actions';

export function RecoverFromSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } =
    useRecoverFromSecretPhraseForm();
  const { isDirty } = formState;

  function onSubmit({ phrase }: FieldValues) {
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
