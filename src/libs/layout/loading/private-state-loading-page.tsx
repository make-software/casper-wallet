import React from 'react';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Spinner } from '@libs/ui/components';

/**
 * Shown while an on-demand secret fetch is in flight — worst case ~16s against a
 * degraded background, which as a blank render is indistinguishable from a dead
 * popup. Carries the header of the pages it precedes so the frame doesn't shift
 * once the data lands.
 */
export const PrivateStateLoadingPage = () => (
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
    renderContent={() => <Spinner />}
  />
);
