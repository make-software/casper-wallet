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
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountCreated } from '@src/background/redux/vault/actions';
import { initializeWallet } from '@src/libs/services';

import { RecoverFromSecretPhrasePageContent } from './content';

export function RecoverFromSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState } =
    useRecoverFromSecretPhraseForm();
  const { isDirty } = formState;

  async function onSubmit({ phrase }: FieldValues) {
    // TODO: Parse phrase and restore wallet from it
    const isParsingPhraseWasSuccess = true;
    if (isParsingPhraseWasSuccess) {
      const account = initializeWallet();
      dispatchToMainStore(accountCreated(account));
      await closeActiveTab();
    } else {
      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: t(
            'We can’t connect your wallet with this secret phrase'
          ),
          errorContentText: t(
            'It could be you’ve made a mistake while entering it. Please try again.'
          ),
          errorPrimaryButtonLabel: t('Try again'),
          errorRedirectPath: RouterPath.RecoverFromSecretPhrase
        })
      );
    }
  }

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
            <Button disabled={!isDirty}>
              <Trans t={t}>Connect to my wallet</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
