import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ContactsBookPageContent } from '@popup/pages/contacts/content';
import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui';

export const ContactsBookPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="back"
              onClick={() => navigate(RouterPath.Home)}
            />
          )}
        />
      )}
      renderContent={() => <ContactsBookPageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            onClick={() => {
              navigate(RouterPath.AddContact);
            }}
          >
            <Trans t={t}>Add contact</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
