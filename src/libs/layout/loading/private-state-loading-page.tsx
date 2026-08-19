import React, { type JSX } from 'react';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Spinner } from '@libs/ui/components';

interface PrivateStateLoadingPageProps {
  /** Pass the page's own header when it differs from the standard popup one. */
  renderHeader?: () => JSX.Element;
}

const renderDefaultHeader = () => (
  <HeaderPopup
    withNetworkSwitcher
    withMenu
    withConnectionStatus
    renderSubmenuBarItems={() => <HeaderSubmenuBarNavLink linkType="back" />}
  />
);

/**
 * Shown while an on-demand secret fetch is in flight — worst case ~16s against a
 * degraded background, which as a blank render is indistinguishable from a dead
 * popup. Carries the header of the page it precedes so the frame doesn't shift
 * once the data lands.
 */
export const PrivateStateLoadingPage = ({
  renderHeader = renderDefaultHeader
}: PrivateStateLoadingPageProps) => (
  <PopupLayout renderHeader={renderHeader} renderContent={() => <Spinner />} />
);
