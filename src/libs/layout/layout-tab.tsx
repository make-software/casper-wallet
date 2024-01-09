import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@libs/ui/components';

import { CenteredFlexColumn } from './containers';

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

interface ContentContainerProps {
  layoutContext: 'withIllustration' | 'withStepper';
}

const MainContainer = styled.div<ContentContainerProps>`
  background-color: ${({ theme, layoutContext }) =>
    layoutContext === 'withIllustration'
      ? theme.color.backgroundPrimary
      : theme.color.backgroundSecondary};
  box-shadow: 0 8px 24px rgba(132, 134, 140, 0.12);
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;

  height: 100%;
  width: 100%;
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
        <SvgIcon
          src="assets/icons/casper-wallet-text-logo.svg"
          width={164}
          height={40}
        />
        <MainContainer layoutContext={layoutContext}>
          {renderHeader && renderHeader()}
          {renderContent()}
          {renderFooter && renderFooter()}
        </MainContainer>
      </AbsoluteCenteredContainer>
    </Container>
  );
}
