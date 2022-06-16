import styled from 'styled-components';

interface ContainerWithBottomBorderProps {
  withBottomBorder?: boolean;
}

const ContainerWithBottomBorder = styled.div<ContainerWithBottomBorderProps>`
  border-bottom: ${({ withBottomBorder, theme }) =>
    withBottomBorder ? `1px solid ${theme.color.borderPrimary}` : 'none'};
`;

export const ListItemContainer = styled.div`
  display: flex;

  min-height: 50px;
  height: 100%;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};

  &:last-child ${ContainerWithBottomBorder} {
    border-bottom: none;
  }
`;

export const ListItemContainerWithLeftPadding = styled(ListItemContainer)`
  padding-left: 16px;
`;

export const ListItemContentContainer = styled(ContainerWithBottomBorder)`
  display: flex;
  align-items: center;

  width: 100%;
`;

export const ListItemActionContainer = styled(ContainerWithBottomBorder)`
  display: flex;
  align-items: center;

  padding: 14px 18px;

  cursor: pointer;
`;

export const ListItemIconContainer = styled(ListItemActionContainer)``;

export const ListItemValueContainer = styled(ListItemActionContainer)`
  & > span {
    white-space: nowrap;
  }
`;
