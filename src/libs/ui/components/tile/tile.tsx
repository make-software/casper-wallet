import styled from 'styled-components';

export const Tile = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;
`;
