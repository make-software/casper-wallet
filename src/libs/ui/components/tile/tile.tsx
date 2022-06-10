import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface StyledTileProps {
  withPadding?: boolean;
}

interface TileProps extends StyledTileProps {
  children: ReactNode;
}

const StyledTile = styled.div<StyledTileProps>`
  width: 100%;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  margin-top: 16px;
  padding: ${({ theme, withPadding }) =>
    withPadding ? theme.padding[1.6] : 0};

  border-radius: 1.2rem;
`;

export function Tile({ withPadding, children }: TileProps) {
  return <StyledTile withPadding={withPadding}>{children}</StyledTile>;
}
