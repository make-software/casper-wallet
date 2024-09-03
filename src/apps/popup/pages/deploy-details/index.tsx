import React from 'react';

import { DeployDetailsPageContent } from '@popup/pages/deploy-details/content';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupLayout
} from '@libs/layout';
import { HomePageTabsId } from '@libs/ui/components';

export const DeployDetailsPage = () => {
  const location = useTypedLocation();
  const navigate = useTypedNavigate();

  const { deploy, navigateHome } = location.state;

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink
                linkType="back"
                onClick={
                  navigateHome
                    ? () => {
                        navigate(RouterPath.Home, {
                          state: {
                            // set the active tab to deploys
                            activeTabId: HomePageTabsId.Deploys
                          }
                        });
                      }
                    : undefined
                }
              />
              <HeaderViewInExplorer deployHash={deploy?.deployHash} />
            </>
          )}
        />
      )}
      renderContent={() => <DeployDetailsPageContent deploy={deploy} />}
    />
  );
};
