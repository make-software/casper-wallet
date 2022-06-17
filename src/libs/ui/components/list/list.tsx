import React from 'react';
import styled, { css } from 'styled-components';

import { Tile, Typography } from '@libs/ui';

const HeaderLabelContainer = styled.div`
  margin-top: 16px;
`;

interface BorderBottomPseudoElementProps {
  marginLeftForItemSeparatorLine: number;
}

const borderBottomPseudoElementRules = css<BorderBottomPseudoElementProps>`
  content: '';
  width: ${({ marginLeftForItemSeparatorLine }) =>
    `calc(100% - ${marginLeftForItemSeparatorLine}px)`};
  margin-left: ${({ marginLeftForItemSeparatorLine }) =>
    marginLeftForItemSeparatorLine}px;
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
  marginLeftForItemSeparatorLine,
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
        <RowsContainer
          marginLeftForItemSeparatorLine={marginLeftForItemSeparatorLine}
        >
          {rows.map(row => (
            <RowContainer>{renderRow(row)}</RowContainer>
          ))}
        </RowsContainer>
        {renderFooter && (
          <ListFooterContainer
            marginLeftForItemSeparatorLine={marginLeftForItemSeparatorLine}
          >
            {renderFooter()}
          </ListFooterContainer>
        )}
      </Tile>
    </>
  );
}
