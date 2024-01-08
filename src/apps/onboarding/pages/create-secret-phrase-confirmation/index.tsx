import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SetFormState } from '@onboarding/app-router';
import { Stepper } from '@onboarding/components/stepper';
import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';

import { generateSecretPhrase } from '@libs/crypto';
import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { CreateSecretPhraseConfirmationPageContent } from './content';

interface CreateSecretPhraseConfirmationPageProps {
  setFormState: SetFormState;
}

export function CreateSecretPhraseConfirmationPage({
  setFormState
}: CreateSecretPhraseConfirmationPageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(RouterPath.CreateSecretPhrase);
  };

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" onClick={handleBack} />
          <Stepper length={6} activeIndex={2} />
        </TabHeaderContainer>
      )}
      renderContent={() => <CreateSecretPhraseConfirmationPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Checkbox
            checked={isChecked}
            onChange={() => setIsChecked(currentValue => !currentValue)}
            label={t(
              'I understand that I am solely responsible for storing and protecting my secret recovery phrase. Access to my funds depend on it.'
            )}
          />
          <Button
            disabled={!isChecked}
            onClick={() => {
              setFormState('secretPhrase', generateSecretPhrase());
              navigate(RouterPath.WriteDownSecretPhrase);
            }}
          >
            <Trans t={t}>Next</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
