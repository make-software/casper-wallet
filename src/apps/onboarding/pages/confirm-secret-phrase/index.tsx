import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@src/libs/layout';
import { createErrorLocationState, ErrorPath } from '@src/libs/layout/error';
import { Button } from '@src/libs/ui';
import { SecretPhrase } from '@src/libs/crypto';

import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { ConfirmSecretPhrasePageContent } from './content';
import { initializeVault } from '@src/background/redux/vault/actions';
import { dispatchToMainStore } from '@src/background/redux/utils';

interface ConfirmSecretPhrasePageProps {
  phrase: SecretPhrase | null;
}

export function ConfirmSecretPhrasePage({
  phrase
}: ConfirmSecretPhrasePageProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const [isConfirmationSuccess, setIsConfirmationSuccess] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  if (phrase == null) {
    return <Navigate to={RouterPath.Any} />;
  }

  function handleSubmit() {
    try {
      if (isConfirmationSuccess && phrase) {
        dispatchToMainStore(initializeVault({ secretPhrase: phrase }));
        navigate(RouterPath.ConfirmSecretPhraseSuccess);
      } else {
        throw Error('Invalid secret phrase.');
      }
    } catch (err) {
      console.error(err);
      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: t('Ah, that’s not guite a correct secret phrase'),
          errorContentText: t(
            'You can start over again. Make sure you save your secret phrase as a text file or write it down somewhere.'
          ),
          errorPrimaryButtonLabel: t('Start over again'),
          errorRedirectPath: RouterPath.CreateSecretPhraseConfirmation
        })
      );
    }
  }

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" />
          <Stepper length={6} activeIndex={4} />
        </TabHeaderContainer>
      )}
      renderContent={() => (
        <ConfirmSecretPhrasePageContent
          phrase={phrase}
          setIsFormValid={setIsFormValid}
          setIsConfirmationSuccess={setIsConfirmationSuccess}
        />
      )}
      renderFooter={() => (
        <TabFooterContainer>
          <Button disabled={!isFormValid} onClick={handleSubmit}>
            <Trans t={t}>Confirm</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
