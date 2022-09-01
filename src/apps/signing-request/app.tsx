import React from 'react';

import { LayoutWindow, HeaderWindowWithoutRouter } from '@libs/layout';

import { SignatureRequestPage } from './signing-request';
import { transferData } from './mocked-data';

export function App() {
  return (
    <LayoutWindow
      Header={<HeaderWindowWithoutRouter />}
      Content={<SignatureRequestPage request={transferData} />}
    />
  );
}
