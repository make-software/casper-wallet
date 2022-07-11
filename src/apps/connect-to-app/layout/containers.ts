import styled from 'styled-components';

interface FooterButtonsContainerProps {
  direction?: 'row' | 'column';
}

export const FooterButtonsContainer = styled.div<FooterButtonsContainerProps>`
  margin-top: 16px;

  width: 100%;

  display: flex;
  flex-direction: ${({ direction }) => (direction ? direction : 'column')};
  justify-content: space-around;
  gap: 16px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => theme.padding[1.6]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  height: 100%;
`;

export const PaddingContainer = styled.div`
  padding: ${({ theme }) => theme.padding['1.6']};
`;
