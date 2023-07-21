import React, { useEffect, useState } from 'react';

import {
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { ActivityDetailsPageContent } from './content';
import {
  dispatchFetchExtendedDeploysInfo,
  ExtendedDeploy
} from '@libs/services/account-activity-service';

export const ActivityDetailsPage = () => {
  const [deployInfo, setDeployInfo] = useState<ExtendedDeploy | null>(null);

  const location = useTypedLocation();
  const navigate = useTypedNavigate();

  const { activityDetailsData } = location.state;

  useEffect(() => {
    if (!activityDetailsData) {
      navigate(RouterPath.Home);
    }
  }, [activityDetailsData, navigate]);

  useEffect(() => {
    if (activityDetailsData?.deployHash) {
      dispatchFetchExtendedDeploysInfo(activityDetailsData?.deployHash).then(
        ({ payload: deployInfoResponse }) => {
          setDeployInfo(deployInfoResponse);
        }
      );
    }
  }, [activityDetailsData?.deployHash]);

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink linkType="back" />
              <HeaderViewInExplorer deployHash={deployInfo?.deployHash} />
            </>
          )}
        />
      )}
      renderContent={() => (
        <ActivityDetailsPageContent
          fromAccount={activityDetailsData?.fromAccount}
          toAccount={activityDetailsData?.toAccount}
          type={activityDetailsData?.type}
          amount={activityDetailsData?.amount}
          symbol={activityDetailsData?.symbol}
          deployInfo={deployInfo}
        />
      )}
    />
  );
};
