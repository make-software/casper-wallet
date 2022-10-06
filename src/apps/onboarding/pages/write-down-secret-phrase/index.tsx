import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import {
  LayoutTab,
  TabHeaderContainer,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { RouterPath, useTypedLocation } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { Stepper } from '@src/apps/onboarding/components/stepper';

import { WriteDownSecretPhrasePageContent } from './content';

interface WriteDownSecretPhrasePageProps {
  phrase: string[] | null;
}

export function WriteDownSecretPhrasePage({
  phrase
}: WriteDownSecretPhrasePageProps) {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  if (phrase == null) {
    return <Navigate to={RouterPath.CreateSecretPhrase} />;
  }

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" />
          <Stepper steps={6} step={4} />
        </TabHeaderContainer>
      )}
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
