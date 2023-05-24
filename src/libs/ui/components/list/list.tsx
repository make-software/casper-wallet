import React from 'react';
import styled, { css } from 'styled-components';

import { Tile, Typography } from '@libs/ui';
import { SpacingSize, VerticalSpaceContainer } from '@src/libs/layout';

const SpacedBetweenFlexRox = styled.div`
  display: flex;
  justify-content: space-between;

  margin: 0 16px;
`;

const PointerContainer = styled.div`
  cursor: pointer;
`;

interface BorderBottomPseudoElementProps {
  marginLeftForSeparatorLine: number;
}

const borderBottomPseudoElementRules = css<BorderBottomPseudoElementProps>`
  content: '';
  width: ${({ marginLeftForSeparatorLine }) =>
    `calc(100% - ${marginLeftForSeparatorLine}px)`};
  margin-left: ${({ marginLeftForSeparatorLine }) =>
    marginLeftForSeparatorLine}px;
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
const ListHeaderContainer = styled(FlexColumn)`
  &::after {
    ${borderBottomPseudoElementRules};
  }
`;
const ListFooterContainer = styled(FlexColumn)`
  &::before {
    ${borderBottomPseudoElementRules};
  }
`;

interface HeaderAction {
  caption: string;
  onClick: () => void;
}

interface ListRowBase {
  id: number | string;
}

interface ListProps<ListRow extends ListRowBase> {
  rows: ListRow[];
  renderRow: (row: ListRow, index: number, array: ListRow[]) => JSX.Element;
  renderFooter?: () => JSX.Element;
  renderHeader?: () => JSX.Element;
  headerLabel?: string;
  headerAction?: HeaderAction;
  headerLabelTop?: SpacingSize;
  contentTop?: SpacingSize;
  marginLeftForHeaderSeparatorLine?: number;
  marginLeftForItemSeparatorLine: number;
}

export function List<ListRow extends ListRowBase>({
  rows,
  renderRow,
  renderHeader,
  renderFooter,
  headerLabel,
  headerAction,
  marginLeftForItemSeparatorLine,
  marginLeftForHeaderSeparatorLine,
  headerLabelTop = SpacingSize.XL,
  contentTop = SpacingSize.XL
}: ListProps<ListRow>) {
  return (
    <>
      {headerLabel && (
        <VerticalSpaceContainer top={headerLabelTop}>
          <SpacedBetweenFlexRox>
            <Typography type="labelMedium" color="contentSecondary">
              {headerLabel}
            </Typography>
            {headerAction && (
              <PointerContainer>
                <Typography
                  type="labelMedium"
                  color="contentBlue"
                  onClick={headerAction.onClick}
                >
                  {headerAction.caption}
                </Typography>
              </PointerContainer>
            )}
          </SpacedBetweenFlexRox>
        </VerticalSpaceContainer>
      )}
      <VerticalSpaceContainer top={contentTop}>
        <Tile>
          {renderHeader && (
            <ListHeaderContainer
              marginLeftForSeparatorLine={
                marginLeftForHeaderSeparatorLine ||
                marginLeftForItemSeparatorLine
              }
            >
              {renderHeader()}
            </ListHeaderContainer>
          )}
          <RowsContainer
            marginLeftForSeparatorLine={marginLeftForItemSeparatorLine}
          >
            {rows.map((row, index, array) => (
              <RowContainer key={row.id}>
                {renderRow(row, index, array)}
              </RowContainer>
            ))}
          </RowsContainer>
          {renderFooter && (
            <ListFooterContainer
              marginLeftForSeparatorLine={marginLeftForItemSeparatorLine}
            >
              {renderFooter()}
            </ListFooterContainer>
          )}
        </Tile>
      </VerticalSpaceContainer>
    </>
  );
}
