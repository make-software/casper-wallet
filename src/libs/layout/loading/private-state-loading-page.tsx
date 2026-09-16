import React, { type JSX } from 'react';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Spinner } from '@libs/ui/components';

interface PrivateStateLoadingPageProps {
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
 * Shown while an on-demand secret fetch is in flight — worst case ~16s, which as a
 * blank render is indistinguishable from a dead popup.
 */
export const PrivateStateLoadingPage = ({
  renderHeader = renderDefaultHeader
}: PrivateStateLoadingPageProps) => (
  <PopupLayout renderHeader={renderHeader} renderContent={() => <Spinner />} />
);
