import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@libs/ui';
import { CenteredFlexColumn, AlignedFlexRow } from '@layout/index';

const Container = styled.div`
  width: 100%;
  height: 100%;

  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

const AbsoluteCenteredContainer = styled(CenteredFlexColumn)`
  width: 512px;
  gap: 40px;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const HeaderContainer = styled(AlignedFlexRow)`
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  height: 56px;

  padding: 16px 20px;
`;

interface ContentContainerProps {
  layoutContext: 'withIllustration' | 'withStepper';
}

const MainContainer = styled.div<ContentContainerProps>`
  background-color: ${({ theme, layoutContext }) =>
    layoutContext === 'withIllustration'
      ? theme.color.backgroundPrimary
      : theme.color.backgroundSecondary};
  box-shadow: 0 8px 24px rgba(132, 134, 140, 0.12);
  border-radius: 12px;

  height: 100%;
  overflow-y: auto;
`;

interface LayoutProps extends ContentContainerProps {
  renderHeader?: () => JSX.Element;
  renderContent: () => JSX.Element;
  renderFooter?: () => JSX.Element;
}

export function LayoutTab({
  layoutContext,
  renderHeader,
  renderContent,
  renderFooter
}: LayoutProps) {
  return (
    <Container>
      <AbsoluteCenteredContainer>
        <SvgIcon src="assets/icons/logo.svg" color="brandRed" size={60} />
        <MainContainer layoutContext={layoutContext}>
          {renderHeader && <HeaderContainer>{renderHeader()}</HeaderContainer>}
          {renderContent()}
          {renderFooter && renderFooter()}
        </MainContainer>
      </AbsoluteCenteredContainer>
    </Container>
  );
}
