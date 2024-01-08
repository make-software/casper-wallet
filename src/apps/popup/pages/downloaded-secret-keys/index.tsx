import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui';

import { DownloadedSecretKeysPageContent } from './content';

export function DownloadedSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
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
