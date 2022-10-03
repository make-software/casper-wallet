import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { WalletCreatedPageContent } from './content';
import browser from 'webextension-polyfill';

export function WalletCreatedPage() {
  const { t } = useTranslation();

  async function closeActiveTab() {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    if (tabs.length > 0 && tabs[0].id != null) {
      await browser.tabs.remove(tabs[0].id);
    }
  }

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <WalletCreatedPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={closeActiveTab}>
            <Trans t={t}>Got it</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
