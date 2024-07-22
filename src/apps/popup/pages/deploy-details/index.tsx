import React from 'react';

import { DeployDetailsPageContent } from '@popup/pages/deploy-details/content';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupLayout
} from '@libs/layout';

export const DeployDetailsPage = () => {
  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink linkType="back" />
              <HeaderViewInExplorer deployHash={'deployHash'} />
            </>
          )}
        />
      )}
      renderContent={() => <DeployDetailsPageContent />}
    />
  );
};
