import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { MacScrollbar } from 'mac-scrollbar';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled.div`
  height: 100%;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  width: 100%;
  height: calc(100% - 128px); // 128px is headers height
`;

export function LayoutWindow({ Header, Content }: Props) {
  return (
    <MacScrollbar>
      <Container>
        <PageHeader>{Header}</PageHeader>
        <PageContent>{Content}</PageContent>
      </Container>
    </MacScrollbar>
  );
}
