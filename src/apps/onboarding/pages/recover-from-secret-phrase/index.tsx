import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';
import { useRecoverFromSecretPhraseForm } from '@libs/ui/forms/recover-from-secret-phrase';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';
import { closeActiveTab } from '@src/apps/onboarding/utils/close-active-tab';

import { RecoverFromSecretPhrasePageContent } from './content';
import { FieldValues } from 'react-hook-form';

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
      await closeActiveTab();
    } else {
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
        renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
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
