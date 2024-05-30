import React from 'react';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';

import { AllAccountsContent } from './content';

export const AllAccountsPage = () => (
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
    renderContent={() => <AllAccountsContent />}
  />
);
