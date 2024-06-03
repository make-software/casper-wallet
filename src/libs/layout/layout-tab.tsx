import React from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@libs/ui/components';

import { CenteredFlexColumn, FlexColumn } from './containers';

const Container = styled.div`
  width: 100%;
  height: 100%;

  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

const AbsoluteCenteredContainer = styled(CenteredFlexColumn)`
  width: 512px;
  gap: 60px;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

interface ContentContainerProps {
  layoutContext: 'withIllustration' | 'withStepper';
  minHeight?: number | 'auto';
}

const MainContainer = styled(FlexColumn)<ContentContainerProps>`
  background-color: ${({ theme, layoutContext }) =>
    layoutContext === 'withIllustration'
      ? theme.color.backgroundPrimary
      : theme.color.backgroundSecondary};
  box-shadow: 0 8px 24px rgba(132, 134, 140, 0.12);
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;

  height: 100%;
  width: 100%;
  min-height: ${({ minHeight }) =>
    minHeight === 'auto' ? minHeight : minHeight ? `${minHeight}px` : '560px'};
  overflow-y: auto;
`;

const ContentContainer = styled.div`
  height: 100%;
  flex-grow: 1;
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
  renderFooter,
  minHeight
}: LayoutProps) {
  return (
    <Container>
      <AbsoluteCenteredContainer>
        <SvgIcon
          src="assets/icons/casper-wallet-text-logo.svg"
          width={164}
          height={40}
        />
        <MainContainer layoutContext={layoutContext} minHeight={minHeight}>
          {renderHeader && renderHeader()}
          <ContentContainer>{renderContent()}</ContentContainer>
          {renderFooter && renderFooter()}
        </MainContainer>
      </AbsoluteCenteredContainer>
    </Container>
  );
}
