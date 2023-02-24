import styled from 'styled-components';
import { Tile } from '@libs/ui';

// REFACTOR: this is confusing, it should be replaced by paragraphcontainer composition
export const PageTile = styled(Tile)`
  padding: ${({ theme }) => theme.padding[1.6]};
  margin-top: 16px;
`;
