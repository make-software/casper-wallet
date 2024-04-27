import React from 'react';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { ILedgerEvent, LedgerTransport } from '@libs/services/ledger';
import { LedgerEventView, renderLedgerFooter } from '@libs/ui/components';

interface INotConnectedLedgerProps {
  event: ILedgerEvent;
  onConnect: (tr?: LedgerTransport) => () => Promise<void>;
}

export const NotConnectedLedger: React.FC<INotConnectedLedgerProps> = ({
  event,
  onConnect
}) => {
  const navigate = useTypedNavigate();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="close" />
          )}
        />
      )}
      renderContent={() => <LedgerEventView event={event} />}
      renderFooter={renderLedgerFooter({
        event,
        onConnect,
        onErrorCtaPressed: () => {
          navigate(RouterPath.Home);
        }
      })}
    />
  );
};
