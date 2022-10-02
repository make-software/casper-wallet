import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { WalletCreatedPageContent } from './content';

export function WalletCreatedPage() {
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <WalletCreatedPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button>
            <Trans t={t}>Got it</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
