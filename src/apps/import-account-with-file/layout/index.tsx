import React, { ReactElement } from 'react';
import { Layout } from '@src/layout';
import { Header } from './header';

interface ImportAccountWithFileLayoutProps {
  Content: ReactElement;
}

export function ImportAccountWithFileLayout({
  Content
}: ImportAccountWithFileLayoutProps) {
  return <Layout Header={<Header />} Content={Content} />;
}
