import React from 'react';
import styled from 'styled-components';
import { MacScrollbar } from 'mac-scrollbar';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { Tile, Typography } from '@libs/ui';
import {
  SpacingSize,
  VerticalSpaceContainer,
  borderBottomPseudoElementRules,
  BorderBottomPseudoElementProps
} from '@src/libs/layout';

interface ListHeaderContainerProps extends BorderBottomPseudoElementProps {
  stickyHeader?: boolean;
}

interface RowsContainerProps extends BorderBottomPseudoElementProps {
  maxHeight?: number;
}

const SpacedBetweenFlexRox = styled.div`
  display: flex;
  justify-content: space-between;

  margin: 0 16px;
`;

const PointerContainer = styled.div`
  cursor: pointer;
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RowsContainer = styled.div<RowsContainerProps>`
  overflow-y: auto;
  max-height: ${({ maxHeight }) => (maxHeight ? `${maxHeight}px` : 'auto')};
  & > * + *:before {
    ${borderBottomPseudoElementRules};
  }
`;

const RowContainer = styled(FlexColumn)``;
const ListHeaderContainer = styled(FlexColumn)<ListHeaderContainerProps>`
  ${({ stickyHeader, theme }) =>
    stickyHeader
      ? `position: sticky; top: 72px; z-index: 1; background: ${theme.color.backgroundSecondary}};`
      : ''};

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
  stickyHeader?: boolean;
  maxHeight?: number;
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
  contentTop = SpacingSize.XL,
  stickyHeader,
  maxHeight
}: ListProps<ListRow>) {
  return (
    <>
      {headerLabel && (
        <VerticalSpaceContainer top={headerLabelTop}>
          <SpacedBetweenFlexRox>
            <Typography type="labelMedium" uppercase color="contentSecondary">
              {headerLabel}
            </Typography>
            {headerAction && (
              <PointerContainer>
                <Typography
                  type="labelMedium"
                  uppercase
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
              stickyHeader={stickyHeader}
            >
              {renderHeader()}
            </ListHeaderContainer>
          )}
          <MacScrollbar>
            <RowsContainer
              marginLeftForSeparatorLine={marginLeftForItemSeparatorLine}
              maxHeight={maxHeight}
            >
              {rows.map((row, index, array) => (
                <RowContainer key={row.id}>
                  {renderRow(row, index, array)}
                </RowContainer>
              ))}
            </RowsContainer>
          </MacScrollbar>
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
