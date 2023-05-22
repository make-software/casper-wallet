import React, { useEffect } from 'react';

import {
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { ActivityDetailsPageContent } from './content';

export const ActivityDetailsPage = () => {
  const location = useTypedLocation();
  const navigate = useTypedNavigate();

  const { activityDetailsData } = location.state;

  useEffect(() => {
    if (!activityDetailsData) {
      navigate(RouterPath.Home);
    }
  }, [activityDetailsData, navigate]);

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <ActivityDetailsPageContent
          fromAccountPublicKey={activityDetailsData?.fromAccountPublicKey}
          toAccountPublicKey={activityDetailsData?.toAccountPublicKey}
          deployHash={activityDetailsData?.deployHash}
        />
      )}
    />
  );
};
