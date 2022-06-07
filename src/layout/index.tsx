import React, { ReactElement } from 'react';
import styled from 'styled-components';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled.div`
  // TODO: investigate bug with layout. Scroll doesn't appear for value 600px, but it does for 599.9px
  // Ticket in ZenHub - https://app.zenhub.com/workspaces/casper-signer-v2-61e1eff68a7f850022d10cc1/issues/make-software/casper-signer-v2/82
  min-height: 599.9px;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  min-width: 360px;
  height: 100%;
`;

export function Layout({ Header, Content }: Props) {
  return (
    <Container>
      <PageHeader>{Header}</PageHeader>
      <PageContent>{Content}</PageContent>
    </Container>
  );
}

export * from './logo';
export * from './containers';
