import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabHeaderContainer,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';
import { Stepper } from '@src/apps/onboarding/components/stepper';
import { SetFormState } from '@src/apps/onboarding/app-router';

import { CreateSecretPhraseConfirmationPageContent } from './content';
import { generateSecretPhrase } from '@src/libs/crypto';

interface CreateSecretPhraseConfirmationPageProps {
  setFormState: SetFormState;
}

export function CreateSecretPhraseConfirmationPage({
  setFormState
}: CreateSecretPhraseConfirmationPageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" />
          <Stepper steps={6} step={3} />
        </TabHeaderContainer>
      )}
      renderContent={() => <CreateSecretPhraseConfirmationPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Checkbox
            checked={isChecked}
            onChange={() => setIsChecked(currentValue => !currentValue)}
            label={t(
              'I understand I have to be careful to save my secret phrase.\n' +
                'My money will depend on it.'
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
