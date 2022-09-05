import React from 'react';

import { LayoutWindow, HeaderWindowWithoutRouter } from '@libs/layout';

import { SignatureRequestPage } from './signature-request';

export function App() {
  return (
    <LayoutWindow
      Header={<HeaderWindowWithoutRouter />}
      Content={<SignatureRequestPage />}
    />
  );
}
