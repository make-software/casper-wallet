import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { RouterPath, useTypedLocation } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { ConfirmSecretPhrasePageContent } from './content';

export function ConfirmSecretPhrasePage() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  if (location.state?.phrase == null) {
    throw new Error("Mnemonic phrase didn't passed");
  }

  const { phrase } = location.state;

  const [isPhraseConfirmed, setIsPhraseConfirmed] = useState(false);
  const [isConfirmationFormFilled, setIsConfirmationFormFilled] =
    useState(false);

  function handleSubmit() {
    if (isPhraseConfirmed) {
      navigate(RouterPath.ConfirmSecretPhraseSuccess);
    } else {
      navigate(RouterPath.OnboardingError, {
        state: {
          errorHeaderText: t('Ah, that’s not guite a correct secret phrase'),
          errorContentText: t(
            'You can start over again. Make sure you save your secret phrase as a text file or write it down somewhere.'
          ),
          errorPrimaryButtonLabel: t('Start over again')
        }
      });
    }
  }

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => (
        <ConfirmSecretPhrasePageContent
          phrase={phrase}
          setIsConfirmationFormFilled={setIsConfirmationFormFilled}
          setIsPhraseConfirmed={setIsPhraseConfirmed}
        />
      )}
      renderFooter={() => (
        <TabFooterContainer>
          <Button disabled={!isConfirmationFormFilled} onClick={handleSubmit}>
            <Trans t={t}>Confirm</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
