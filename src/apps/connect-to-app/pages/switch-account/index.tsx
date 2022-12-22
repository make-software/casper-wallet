import React from 'react';

import {
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@src/libs/layout';

import { SwitchAccountContent } from './content';

export function SwitchAccountPage() {
  return (
    <LayoutWindow
      renderHeader={() => (
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="cancelWindow" />
          )}
        />
      )}
      renderContent={() => <SwitchAccountContent />}
    />
  );
}
