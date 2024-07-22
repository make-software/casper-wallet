import styled, { css } from 'styled-components';

import { getLinearGradientColor, hexToRGBA } from '@libs/ui/utils';

// Be careful when importing dependencies here
// Import of getColorFromTheme or getLinearGradientColor from '@libs/ui'
// cause huge problems with webpack bundle and lead to blank popups

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
  flexGrow?: number;
}

export const FlexRow = styled.div<FlexRowProps>`
  display: flex;
  gap: ${({ gap }) => getGapSize(gap)};
  flex-wrap: ${({ wrap }) => wrap};
  flex-grow: ${({ flexGrow }) => flexGrow || 'inherit'};
`;

export const AlignedFlexRow = styled(FlexRow)`
  align-items: center;
`;

export const BaseLineFlexRow = styled(FlexRow)`
  align-items: baseline;
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
  background: ${({ theme }) =>
    getLinearGradientColor(theme.color.backgroundRed)};
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
`;

export const TabTextContainer = styled.div`
  margin-top: 24px;
`;

export const TabPageContainer = styled.div`
  padding: 40px 32px 0;
`;

export const BreakWordContainer = styled.div`
  overflow-wrap: break-word;
`;

export const IllustrationContainer = styled.div`
  padding-top: 24px;
  padding-left: 16px;
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

export const BorderContainer = styled.div`
  & > *:last-child {
    ${borderBottomPseudoElementRules};
  }
`;

export const Overlay = styled.div`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.modal};
  top: 50%;
  left: 50%;
  bottom: 0;
  right: 0;

  transform: translate(-50%, -50%);

  overflow: auto;

  height: 100vh;
  width: 360px;

  background: ${({ theme }) => hexToRGBA(theme.color.black, '0.32')};
`;

export const AccountActivityPlateContainer = styled(AlignedSpaceBetweenFlexRow)`
  cursor: pointer;
  padding: 16px 12px;
`;

export const ActivityPlateContentContainer = styled(FlexColumn)`
  flex-grow: 1;
  gap: 2px;
`;

export const ActivityPlateIconCircleContainer = styled(CenteredFlexRow)`
  min-width: 28px;

  width: 28px;
  height: 28px;

  margin-right: 4px;

  background: ${({ theme }) => theme.color.fillNeutral};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

export const ActivityPlateDivider = styled.div`
  width: 2px;
  height: 2px;

  margin: 0 6px;

  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  background-color: ${({ theme }) => theme.color.contentSecondary};
`;

export const DropdownHeader = styled(AlignedSpaceBetweenFlexRow)`
  padding: 8px 16px;

  border-top-left-radius: ${({ theme }) => theme.borderRadius.base}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.base}px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export const AmountContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-end;
  text-align: end;

  max-width: 120px;
`;

export const NftIndexContainer = styled.div`
  padding: 0 6px;
  background: ${({ theme }) => theme.color.backgroundSecondary};
`;
