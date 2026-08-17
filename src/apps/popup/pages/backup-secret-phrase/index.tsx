import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { useSecretPhrase } from '@hooks/use-secret-phrase';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  PrivateStateErrorPage
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { BackupSecretPhrasePageContent } from './content';

export function BackupSecretPhrasePage() {
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);

  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  // Fetch only after password re-confirmation
  const { secretPhrase, error, retry } = useSecretPhrase(isPasswordConfirmed);

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage setPasswordConfirmed={setPasswordConfirmed} />
    );
  }

  if (error) {
    return <PrivateStateErrorPage layout="popup" onRetry={retry} />;
  }

  if (secretPhrase == null) {
    return null;
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <BackupSecretPhrasePageContent phrase={secretPhrase} />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={() => navigate(RouterPath.Home)}>
            <Trans t={t}>I'm done</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
