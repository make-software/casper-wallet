import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { FlexColumn } from '@layout/containers';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
  renderFooter?: () => ReactElement;
}

const Container = styled(FlexColumn)`
  height: 100%;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

export function LayoutWindow({ Header, Content, renderFooter }: Props) {
  return (
    <Container>
      <PageHeader>{Header}</PageHeader>
      <PageContent>{Content}</PageContent>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </Container>
  );
}
