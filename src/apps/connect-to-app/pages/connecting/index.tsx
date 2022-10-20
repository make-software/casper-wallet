import React from 'react';

import { LayoutWindow, PopupHeader } from '@src/libs/layout';

import { ConnectingContent } from './content';

export interface Props {}

export function ConnectingPage() {
  return (
    <LayoutWindow
      renderHeader={() => <PopupHeader />}
      renderContent={() => <ConnectingContent />}
    />
  );
}
