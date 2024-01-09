import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ContactsBookPageContent } from '@popup/pages/contacts/content';
import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';

export const ContactsBookPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
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
