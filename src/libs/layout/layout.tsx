import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { FlexColumn } from './containers';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled(FlexColumn)`
  height: 100%;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  height: 472px;
  overflow-y: auto;
`;

export function Layout({ Header, Content }: Props) {
  return (
    <Container>
      <PageHeader>{Header}</PageHeader>
      <PageContent>{Content}</PageContent>
    </Container>
  );
}
