import React from 'react';

import { LayoutWindow, PopupHeaderWithoutRouter } from '@libs/layout';

import { SignatureRequestPage } from './signature-request';

export function App() {
  return (
    <LayoutWindow
      Header={<PopupHeaderWithoutRouter />}
      Content={<SignatureRequestPage />}
    />
  );
}
