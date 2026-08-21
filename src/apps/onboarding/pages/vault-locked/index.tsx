import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@onboarding/router';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui/components';

import { VaultLockedPageContent } from './content';

/**
 * Shown when keys exist but the session does not — a locked vault, or an
 * onboarding that was abandoned after the password step. Onboarding is not on
 * the unlock allowlist, so the only action offered here is the confirmed reset;
 * unlocking happens in the extension popup.
 */
export function VaultLockedPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <VaultLockedPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            color="secondaryRed"
            onClick={() => navigate(RouterPath.ResetWallet)}
          >
            <Trans t={t}>Start again</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
