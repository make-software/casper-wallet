import styled from 'styled-components';

// Default direction value is `row`
interface Props {
  direction?: 'row' | 'column';
}

export const ButtonsContainer = styled.div<Props>`
  display: flex;
  flex-direction: ${({ direction }) => (direction ? direction : 'row')};
  justify-content: space-around;
  gap: 20px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => theme.padding[1.6]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;
