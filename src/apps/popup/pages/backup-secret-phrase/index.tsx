import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  PopupLayout,
  PopupHeader,
  HeaderSubmenuBarNavLink,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { BackupSecretPhrasePasswordPage } from '@popup/pages/backup-secret-phrase-password';

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
      <BackupSecretPhrasePasswordPage
        setPasswordConfirmed={setPasswordConfirmed}
      />
    );
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withLock
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
