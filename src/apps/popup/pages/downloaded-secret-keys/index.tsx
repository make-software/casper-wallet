import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { DownloadedSecretKeysPageContent } from './content';

export function DownloadedSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="close" />
          )}
        />
      )}
      renderContent={() => <DownloadedSecretKeysPageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={() => navigate(RouterPath.Home)}>
            <Trans t={t}>Done</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
