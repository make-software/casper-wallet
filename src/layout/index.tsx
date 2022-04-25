import React, { ReactElement } from 'react';
import styled from 'styled-components';

interface Props {
  Header: ReactElement<any, any>;
  Content: ReactElement<any, any>;
  Footer?: ReactElement<any, any>;
  // TODO: Optimise sizes; Remove dependency from count of buttons in footer
  contentHeight?:
    | 399 // With 2 buttons in footer
    | 455 // With 2 button in footer
    | 528; // Without buttons in footer
}

// TODO: Implement Header component
const PageHeader = styled.header``;

interface PageContentProps {
  contentHeight: number;
}

const PageContent = styled.div<PageContentProps>`
  padding: 0 ${({ theme }) => theme.padding[1.6]};
  min-width: 360px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  height: ${({ contentHeight }) => contentHeight}px;
`;

const PageFooter = styled.div``;

export function Layout({
  Header,
  Content,
  Footer,
  contentHeight = 528
}: Props) {
  return (
    <>
      <PageHeader>{Header}</PageHeader>
      <PageContent contentHeight={contentHeight}>{Content}</PageContent>
      {Footer && <PageFooter>{Footer}</PageFooter>}
    </>
  );
}

export * from './header';
