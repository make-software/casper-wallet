import React from 'react';
import styled, { css } from 'styled-components';

import { Tile, Typography } from '@libs/ui';

const HeaderLabelContainer = styled.div`
  margin-top: 16px;
`;

interface BorderBottomPseudoElementProps {
  marginLeftForItemSeparator: number;
}

const borderBottomPseudoElementRules = css<BorderBottomPseudoElementProps>`
  content: '';
  width: ${({ marginLeftForItemSeparator }) =>
    `calc(100% - ${marginLeftForItemSeparator}px)`};
  margin-left: ${({ marginLeftForItemSeparator }) =>
    marginLeftForItemSeparator}px;
  border-bottom: ${({ theme }) => `0.5px solid ${theme.color.borderPrimary}`};
`;

const RowsContainer = styled.div`
  & > * + *:before {
    ${borderBottomPseudoElementRules};
  }
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const RowContainer = styled(FlexColumn)``;
const ListFooterContainer = styled(FlexColumn)`
  &::before {
    ${borderBottomPseudoElementRules};
  }
`;

interface ListProps<T> extends BorderBottomPseudoElementProps {
  rows: T[];
  renderRow: (rowData: T) => JSX.Element;
  renderFooter?: () => JSX.Element;
  headerLabel?: string;
}

export function List<T>({
  rows,
  renderRow,
  marginLeftForItemSeparator,
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
        <RowsContainer marginLeftForItemSeparator={marginLeftForItemSeparator}>
          {rows.map(row => (
            <RowContainer>{renderRow(row)}</RowContainer>
          ))}
        </RowsContainer>
        <ListFooterContainer
          marginLeftForItemSeparator={marginLeftForItemSeparator}
        >
          {renderFooter && renderFooter()}
        </ListFooterContainer>
      </Tile>
    </>
  );
}

export * from './list-containers';
