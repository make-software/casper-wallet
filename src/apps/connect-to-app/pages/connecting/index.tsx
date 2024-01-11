import React from 'react';

import { HeaderPopup, LayoutWindow } from '@libs/layout';

import { ConnectingContent } from './content';

export interface ConnectingPageProps {
  origin: string;
}

export function ConnectingPage({ origin }: ConnectingPageProps) {
  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => <ConnectingContent origin={origin} />}
    />
  );
}
