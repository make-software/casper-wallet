import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutWindow,
  PopupHeader,
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import { useTypedNavigate, RouterPath } from '@src/apps/popup/router';

import { DownloadedSecretKeysPageContent } from './content';

export function DownloadedSecretKeysPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  return (
    <LayoutWindow
      renderHeader={() => (
        <PopupHeader
          withLock
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
