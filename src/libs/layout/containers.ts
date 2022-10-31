import styled from 'styled-components';

const backgroundIconPath = 'assets/icons/logo-background.svg';

interface VerticalSpaceContainerProps {
  gap: 'none' | 'small' | 'medium' | 'big';
}

export const VerticalSpaceContainer = styled.div<VerticalSpaceContainerProps>`
  margin-top: ${({ gap }) => {
    switch (gap) {
      case 'none':
        return 0;
      case 'small':
        return '1.2rem';
      case 'medium':
        return '1.6rem';
      case 'big':
        return '2.4rem';
      default:
        throw new Error('Unknown gap');
    }
  }};
`;

export const FlexRow = styled.div`
  display: flex;
`;

export const AlignedFlexRow = styled(FlexRow)`
  align-items: center;
`;

export const CenteredFlexRow = styled(AlignedFlexRow)`
  justify-content: center;
`;

export const LeftAlignedCenteredFlexRow = styled(AlignedFlexRow)`
  justify-content: flex-start;
`;

export const SpaceBetweenFlexRow = styled(FlexRow)`
  width: 100%;
  justify-content: space-between;
`;

export const AlignedSpaceBetweenFlexRow = styled(AlignedFlexRow)`
  justify-content: space-between;
`;

export const FlexColumn = styled(FlexRow)`
  flex-direction: column;
`;

export const CenteredFlexColumn = styled(FlexColumn)`
  align-items: center;
`;

export const LeftAlignedFlexColumn = styled(FlexColumn)`
  align-items: flex-start;
`;

export const SpaceBetweenFlexColumn = styled(FlexColumn)`
  justify-content: space-between;
`;

export const HeaderContainer = styled(AlignedSpaceBetweenFlexRow)`
  background: url(${backgroundIconPath}) no-repeat;
  background-color: ${({ theme }) => theme.color.backgroundRed};
  height: 72px;

  padding: 0 16px;
`;

export const PageContainer = styled(SpaceBetweenFlexColumn)`
  height: 100%;
`;

export const LogoContainer = styled.div`
  cursor: ${props => (props.onClick ? 'pointer' : 'default')};
`;

export const ContentContainer = styled.div`
  padding: 0 ${({ theme }) => theme.padding[1.6]}
    ${({ theme }) => theme.padding[1.6]};
`;

export const TextContainer = styled(VerticalSpaceContainer)`
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

export const InputsContainer = styled.div`
  margin-top: 24px;
  & > div:nth-child(2) {
    margin-top: 16px;
  }
`;

// Default direction value is `column`
interface Props {
  direction?: 'row' | 'column';
}

export const FooterButtonsContainer = styled(SpaceBetweenFlexRow)<Props>`
  width: 100%;

  flex-direction: ${({ direction }) => (direction ? direction : 'column')};
  gap: 16px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => theme.padding[1.6]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

/**
 * @deprecated to be replaced by FooterButtonsContainer when Popup layout is refactored
 * to be the same as window layout
 */
export const FooterButtonsAbsoluteContainer = styled(FooterButtonsContainer)`
  position: absolute;
  bottom: 0;
  left: 0;
`;

export const ListItemClickableContainer = styled(SpaceBetweenFlexRow)`
  cursor: pointer;

  width: 100%;
  padding: 14px 18px;

  & > * + * {
    padding-left: 18px;
  }

  & > span {
    white-space: nowrap;
  }
`;

export const TabHeaderContainer = styled(AlignedFlexRow)`
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  height: 56px;

  padding: 16px 20px;
  position: relative;
`;

export const TabFooterContainer = styled(FooterButtonsContainer)`
  padding: 24px 32px;
  margin-top: 30px;
`;

export const TabTextContainer = styled.div`
  margin-top: 24px;
`;

export const TabPageContainer = styled.div`
  padding: 24px 32px;
`;

export const BreakWordContainer = styled.div`
  overflow-wrap: break-word;
`;

export const IllustrationContainer = styled.div`
  margin-top: 24px;
  margin-left: 16px;
`;

export const OnboardingIllustrationContainer = styled(IllustrationContainer)`
  margin-top: 40px;
`;
