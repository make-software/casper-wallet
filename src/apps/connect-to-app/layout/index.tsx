import React, { ReactElement } from 'react';
import { Layout } from '@src/layout';
import { Header } from './header';

interface ConnectToAppLayoutProps {
  Content: ReactElement;
}

export function ConnectToAppLayout({ Content }: ConnectToAppLayoutProps) {
  return <Layout Header={<Header />} Content={Content} />;
}
