import styled from 'styled-components';

export const ButtonContainer = styled.div`
  border-top: ${({ theme }) => `1px solid ${theme.color['gray1.5']}`};
  padding: ${({ theme }) => theme.padding[1.333]};
`;
