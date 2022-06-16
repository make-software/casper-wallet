import styled from 'styled-components';

export const Tile = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  margin-top: 16px;

  border-radius: 1.2rem;
`;
