import styled from 'styled-components';
import { Tile } from '@libs/ui';

export const PageTile = styled(Tile)`
  padding: ${({ theme }) => theme.padding[1.6]};
`;
