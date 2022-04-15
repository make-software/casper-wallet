import React from 'react';

import { Layout } from '@src/layout';
import { useCreateVaultComponents } from '@src/pages/create-vault';

export function App() {
  const { CreateVaultPageContent, CreateVaultPageFooter } =
    useCreateVaultComponents();
  return (
    <Layout
      renderHeader={() => <></>}
      renderContent={CreateVaultPageContent}
      renderFooter={CreateVaultPageFooter}
    />
  );
}
