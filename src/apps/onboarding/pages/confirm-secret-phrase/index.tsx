import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { ErrorMessages } from '@src/constants';

import { Stepper } from '@onboarding/components/stepper';
import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';

import { initVault } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { SecretPhrase } from '@libs/crypto';
import {
  ErrorPath,
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer,
  createErrorLocationState
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { ConfirmSecretPhrasePageContent } from './content';

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
        dispatchToMainStore(initVault({ secretPhrase: phrase }));
        navigate(RouterPath.ConfirmSecretPhraseSuccess);
      } else {
        throw Error(ErrorMessages.secretPhrase.INVALID_SECRET_PHRASE.message);
      }
    } catch (err) {
      console.error(err);
      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: t(
            ErrorMessages.secretPhrase.WRONG_SECRET_PHRASE_ORDER.message
          ),
          errorContentText: t(
            ErrorMessages.secretPhrase.WRONG_SECRET_PHRASE_ORDER.description
          ),
          errorPrimaryButtonLabel: t('Generate a new secret recovery phrase'),
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
        <TabFooterContainer style={{ marginTop: '28px' }}>
          <Button disabled={!isFormValid} onClick={handleSubmit}>
            <Trans t={t}>Confirm</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
