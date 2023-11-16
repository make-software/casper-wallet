import styled from 'styled-components';

export const Tile = styled.div<{ borderRadius?: 'base' }>`
  width: 100%;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  border-radius: ${({ theme, borderRadius }) =>
    borderRadius ? theme.borderRadius.base : theme.borderRadius.twelve}px;
`;
