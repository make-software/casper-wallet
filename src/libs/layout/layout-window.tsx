import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { MacScrollbar } from 'mac-scrollbar';

import { FlexColumn } from '@layout/containers';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled(FlexColumn)`
  height: 100%;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  width: 100%;
  height: 100%;
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
