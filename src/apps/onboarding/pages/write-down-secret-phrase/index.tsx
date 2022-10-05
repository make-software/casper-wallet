import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { RouterPath, useTypedLocation } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { WriteDownSecretPhrasePageContent } from './content';

export function WriteDownSecretPhrasePage() {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  if (location.state?.phrase == null) {
    throw new Error("Mnemonic phrase didn't passed");
  }

  const { phrase } = location.state;

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <WriteDownSecretPhrasePageContent phrase={phrase} />}
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
            onClick={() =>
              navigate(RouterPath.ConfirmSecretPhrase, {
                state: { phrase }
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
