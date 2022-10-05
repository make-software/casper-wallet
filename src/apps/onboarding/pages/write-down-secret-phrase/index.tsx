import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';

import { WriteDownSecretPhrasePageContent } from './content';

export function WriteDownSecretPhrasePage() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => (
        <WriteDownSecretPhrasePageContent phrase={mockedMnemonicPhrase} />
      )}
      renderFooter={() => (
        <TabFooterContainer>
          <Checkbox
            checked={isChecked}
            onChange={() => setIsChecked(currentValue => !currentValue)}
            label={t(
              'I confirm I have written down and safely stored my secret phrase.'
            )}
          />
          <Button
            disabled={!isChecked}
            onClick={() => navigate(RouterPath.ConfirmSecretPhrase)}
          >
            <Trans t={t}>Next</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
