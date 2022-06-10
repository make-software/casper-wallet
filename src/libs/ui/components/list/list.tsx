import React from 'react';
import styled from 'styled-components';

import { Tile, Typography } from '@libs/ui';

const HeaderLabelContainer = styled.div`
  margin-top: 16px;
`;

interface ListProps<T> {
  rows: T[];
  renderRow: (rowData: T[]) => JSX.Element[];
  renderFooter?: () => JSX.Element;
  headerLabel?: string;
}

export function List<T>({
  rows,
  renderRow,
  renderFooter,
  headerLabel
}: ListProps<T>) {
  return (
    <>
      {headerLabel && (
        <HeaderLabelContainer>
          <Typography type="label" weight="medium" color="contentSecondary">
            {headerLabel}
          </Typography>
        </HeaderLabelContainer>
      )}
      <Tile>
        {renderRow(rows)}
        {renderFooter && renderFooter()}
      </Tile>
    </>
  );
}

export * from './list-containers';
