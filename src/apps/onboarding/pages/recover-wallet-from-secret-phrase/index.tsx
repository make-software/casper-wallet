import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { RecoverWalletFromSecretPhrasePageContent } from './content';

export function RecoverWalletFromSecretPhrasePage() {
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <RecoverWalletFromSecretPhrasePageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button>
            <Trans t={t}>Connect to my wallet</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
