import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';

import { ConfirmSecretPhrasePageContent } from './content';

interface ConfirmSecretPhrasePageProps {
  phrase: string[];
}

export function ConfirmSecretPhrasePage({
  phrase
}: ConfirmSecretPhrasePageProps) {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => (
        <ConfirmSecretPhrasePageContent phrase={mockedMnemonicPhrase} />
      )}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            onClick={() => navigate(RouterPath.ConfirmSecretPhraseSuccess)}
          >
            <Trans t={t}>Confirm</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
