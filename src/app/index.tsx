import React from 'react';

import { Layout } from '@src/layout';
import {
  CreateVaultPageContent,
  CreateVaultPageFooter
} from '@src/pages/create-vault';

export function App() {
  return (
    <Layout
      renderHeader={() => <></>}
      renderContent={CreateVaultPageContent}
      renderFooter={CreateVaultPageFooter}
    />
  );
}
