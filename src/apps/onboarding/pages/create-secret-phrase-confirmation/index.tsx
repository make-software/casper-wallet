import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mocked-data';

import { CreateSecretPhraseConfirmationPageContent } from './content';

export function CreateSecretPhraseConfirmationPage() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
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
            onClick={() =>
              navigate(RouterPath.WriteDownSecretPhrase, {
                state: { phrase: mockedMnemonicPhrase }
              })
            }
          >
            <Trans t={t}>Next</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
