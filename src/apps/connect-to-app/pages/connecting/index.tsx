import React from 'react';

import { LayoutWindow, PopupHeader } from '@src/libs/layout';

import { ConnectingContent } from './content';

export interface ConnectingPageProps {
  origin: string;
}

export function ConnectingPage({ origin }: ConnectingPageProps) {
  return (
    <LayoutWindow
      renderHeader={() => <PopupHeader />}
      renderContent={() => <ConnectingContent origin={origin} />}
    />
  );
}
