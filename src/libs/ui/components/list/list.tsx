import React from 'react';
import styled, { css } from 'styled-components';

import { Tile, Typography } from '@libs/ui';

const TopMarginContainer = styled.div`
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

interface ListRowBase {
  id: number | string;
}

interface ListProps<ListRow extends ListRowBase>
  extends BorderBottomPseudoElementProps {
  rows: ListRow[];
  renderRow: (row: ListRow) => JSX.Element;
  renderFooter?: () => JSX.Element;
  headerLabel?: string;
}

export function List<ListRow extends ListRowBase>({
  rows,
  renderRow,
  marginLeftForItemSeparatorLine,
  renderFooter,
  headerLabel
}: ListProps<ListRow>) {
  return (
    <>
      {headerLabel && (
        <TopMarginContainer>
          <Typography type="label" weight="medium" color="contentSecondary">
            {headerLabel}
          </Typography>
        </TopMarginContainer>
      )}
      <TopMarginContainer>
        <Tile>
          <RowsContainer
            marginLeftForItemSeparatorLine={marginLeftForItemSeparatorLine}
          >
            {rows.map(row => (
              <RowContainer key={row.id}>{renderRow(row)}</RowContainer>
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
      </TopMarginContainer>
    </>
  );
}
