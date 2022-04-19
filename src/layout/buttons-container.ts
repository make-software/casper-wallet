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

  border-top: ${({ theme }) => `1px solid ${theme.color.borderPrimary}`};
  padding: ${({ theme }) => theme.padding[1.333]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;
