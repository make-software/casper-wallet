import React, { Suspense } from 'react';

import { Layout } from '@src/layout';
import {
  CreateVaultPageContent,
  CreateVaultPageFooter
} from '@src/pages/create-vault';

import './i18n';

export function App() {
  return (
    <Suspense fallback={null}>
      <Layout
        renderHeader={() => <></>}
        renderContent={CreateVaultPageContent}
        renderFooter={CreateVaultPageFooter}
      />
    </Suspense>
  );
}
