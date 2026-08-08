import React from 'react';

import { DeployDetailsPageContent } from '@popup/pages/deploy-details/content';
import { useTypedLocation } from '@popup/router';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupLayout
} from '@libs/layout';

export const DeployDetailsPage = () => {
  const location = useTypedLocation();

  const { deploy } = location.state;

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
              <HeaderViewInExplorer deployHash={deploy?.deployHash} />
            </>
          )}
        />
      )}
      renderContent={() => <DeployDetailsPageContent deploy={deploy} />}
    />
  );
};
