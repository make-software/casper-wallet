import React from 'react';

import { LayoutWindow, PopupHeader } from '@libs/layout';

import { SignatureRequestPage } from './signature-request';

export function App() {
  return (
    <LayoutWindow
      Header={<PopupHeader withoutRouter />}
      Content={<SignatureRequestPage />}
    />
  );
}
