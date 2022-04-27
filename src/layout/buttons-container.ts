import styled from 'styled-components';

// Default direction value is `column`
interface Props {
  direction?: 'row' | 'column';
}

export const ButtonsContainer = styled.div<Props>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;

  display: flex;
  flex-direction: ${({ direction }) => (direction ? direction : 'column')};
  justify-content: space-around;
  gap: 16px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => theme.padding[1.6]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;
