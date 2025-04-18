import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ErrorMessages } from '@src/constants';

import { Stepper } from '@onboarding/components/stepper';
import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';

import { validateSecretPhrase } from '@libs/crypto';
import {
  ErrorPath,
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer,
  createErrorLocationState
} from '@libs/layout';
import { Button } from '@libs/ui/components';
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
        throw Error(ErrorMessages.secretPhrase.INVALID_SECRET_PHRASE.message);
      }
      navigate(RouterPath.SelectAccountsToRecover, {
        state: {
          secretPhrase
        }
      });
    } catch (err) {
      console.error(err);
      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: t(
            ErrorMessages.secretPhrase.IMPORT_SECRET_PHRASE_FAILED.message
          ),
          errorContentText: t(
            ErrorMessages.secretPhrase.IMPORT_SECRET_PHRASE_FAILED.description
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
        minHeight={640}
        renderHeader={() => (
          <TabHeaderContainer>
            <HeaderSubmenuBarNavLink
              linkType="back"
              onClick={() => navigate(RouterPath.CreateSecretPhrase)}
            />
            <Stepper length={4} activeIndex={2} />
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
              <Trans t={t}>Next</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
