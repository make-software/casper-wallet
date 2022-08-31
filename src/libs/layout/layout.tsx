import React, { ReactElement } from 'react';
import styled from 'styled-components';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled.div`
  max-height: 600px;
  min-height: 560px;
  height: 100%;
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
