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
  closeNewLedgerWindowsAndClearState: () => void;
  isAccountSelection?: boolean;
}

export const LedgerConnectionView: React.FC<INotConnectedLedgerProps> = ({
  event,
  onConnect,
  closeNewLedgerWindowsAndClearState,
  isAccountSelection = false
}) => {
  const navigate = useTypedNavigate();

  const onErrorCtaPressed = () => {
    closeNewLedgerWindowsAndClearState();
    navigate(RouterPath.Home);
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="close"
              onClick={onErrorCtaPressed}
            />
          )}
        />
      )}
      renderContent={() => (
        <LedgerEventView
          event={event}
          isAccountSelection={isAccountSelection}
        />
      )}
      renderFooter={renderLedgerFooter({
        event,
        onConnect,
        onErrorCtaPressed
      })}
    />
  );
};
