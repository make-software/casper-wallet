import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { MacScrollbar } from 'mac-scrollbar';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled.div`
  max-height: 600px;
  min-height: 600px;
  height: 100%;
  width: 360px;
`;

const PageHeader = styled.header``;

const PageContent = styled.div``;

export function Layout({ Header, Content }: Props) {
  return (
    <MacScrollbar>
      <Container>
        <PageHeader>{Header}</PageHeader>
        <PageContent>{Content}</PageContent>
      </Container>
    </MacScrollbar>
  );
}
