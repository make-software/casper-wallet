import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui';

import { BackupSecretPhrasePageContent } from './content';

export function BackupSecretPhrasePage() {
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);

  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage setPasswordConfirmed={setPasswordConfirmed} />
    );
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => <BackupSecretPhrasePageContent />}
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
