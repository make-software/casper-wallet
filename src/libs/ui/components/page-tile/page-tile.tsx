import styled from 'styled-components';
import { Tile } from '~src/libs/ui';

export const PageTile = styled(Tile)`
  padding: ${({ theme }) => theme.padding[1.6]};
  margin-top: 16px;
`;
