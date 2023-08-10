import styled, { css } from 'styled-components';
import { FillColor } from '@libs/ui';

// Be careful when importing dependencies here
// Import of getColorFromTheme from '@libs/ui' cause huge problems with webpack bundle and lead to blank popups

export enum SpacingSize {
  None = 'none',
  Tiny = 'tiny',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  XL = 'extra large',
  XXL = 'double extra large',
  XXXL = 'triple extra large'
}

export const getSpacingSize = (size?: SpacingSize) => {
  switch (size ?? SpacingSize.None) {
    case SpacingSize.None:
      return 'initial';
    case SpacingSize.Tiny:
      return '0.8rem';
    case SpacingSize.Small:
      return '1.2rem';
    case SpacingSize.Medium:
      return '1.6rem';
    case SpacingSize.Large:
      return '2rem';
    case SpacingSize.XL:
      return '2.4rem';
    case SpacingSize.XXL:
      return '2.8rem';
    case SpacingSize.XXXL:
      return '3.2rem';
    default:
      throw new Error('Unknown spacing size');
  }
};

interface VerticalSpaceContainerProps {
  top?: SpacingSize;
}

export const VerticalSpaceContainer = styled.div<VerticalSpaceContainerProps>`
  margin-top: ${({ top }) => getSpacingSize(top)};
`;

export const ParagraphContainer = styled(VerticalSpaceContainer)`
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

interface TileContainerProps extends VerticalSpaceContainerProps {
  paddingVertical?: SpacingSize;
  paddingHorizontal?: SpacingSize;
}

export const TileContainer = styled('div')<TileContainerProps>`
  margin-top: 16px;
  padding-top: ${({ paddingVertical }) =>
    getSpacingSize(paddingVertical || SpacingSize.Medium)};
  padding-bottom: ${({ paddingVertical }) =>
    getSpacingSize(paddingVertical || SpacingSize.Medium)};
  padding-left: ${({ paddingHorizontal }) =>
    getSpacingSize(paddingHorizontal || SpacingSize.Medium)};
  padding-right: ${({ paddingHorizontal }) =>
    getSpacingSize(paddingHorizontal || SpacingSize.Medium)};
`;

const getGapSize = (gap?: SpacingSize) => {
  switch (gap ?? SpacingSize.None) {
    case SpacingSize.None:
      return 'initial';
    case SpacingSize.Tiny:
      return '4px';
    case SpacingSize.Small:
      return '8px';
    case SpacingSize.Medium:
      return '12px';
    case SpacingSize.Large:
      return '16px';
    case SpacingSize.XL:
      return '20px';
    case SpacingSize.XXL:
      return '24px';
    case SpacingSize.XXXL:
      return '28px';
    default:
      throw new Error('Unknown gap size');
  }
};

interface FlexRowProps {
  gap?: SpacingSize;
  wrap?: 'wrap' | 'nowrap';
}

export const FlexRow = styled.div<FlexRowProps>`
  display: flex;
  gap: ${({ gap }) => getGapSize(gap)};
  flex-wrap: ${({ wrap }) => wrap};
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

export const RightAlignedCenteredFlexRow = styled(AlignedFlexRow)`
  justify-content: flex-end;
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

export const RightAlignedFlexColumn = styled(FlexColumn)`
  align-items: flex-end;
`;

export const SpaceBetweenFlexColumn = styled(FlexColumn)`
  justify-content: space-between;
`;

export const SpaceAroundFlexColumn = styled(FlexColumn)`
  justify-content: space-around;
`;

export const HeaderContainer = styled(AlignedSpaceBetweenFlexRow)`
  background-color: ${({ theme }) => theme.color.backgroundRed};
  height: 72px;

  padding: 0 16px;

  position: relative;
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

export const AvatarContainer = styled(CenteredFlexColumn)<{
  top?: SpacingSize;
}>`
  margin-top: ${({ top }) => getSpacingSize(top)};
`;

export interface BorderBottomPseudoElementProps {
  marginLeftForSeparatorLine: number;
}

export const borderBottomPseudoElementRules = css<BorderBottomPseudoElementProps>`
  content: '';
  width: ${({ marginLeftForSeparatorLine }) =>
    `calc(100% - ${marginLeftForSeparatorLine}px)`};
  margin-left: ${({ marginLeftForSeparatorLine }) =>
    marginLeftForSeparatorLine}px;
  border-bottom: ${({ theme }) => `0.5px solid ${theme.color.borderPrimary}`};
`;

export const Overlay = styled.div`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.modal};
  top: 0;
  left: 0;

  height: 100vh;
  width: 100vw;

  background: rgba(0, 0, 0, 0.32);
`;

export const IconCircleContainer = styled(CenteredFlexRow)<{
  color: FillColor;
}>`
  height: 48px;
  width: 48px;

  margin: 0 16px;

  background-color: ${({ theme, color }) =>
    color === 'inherit' ? 'inherit' : theme.color[color]};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;
