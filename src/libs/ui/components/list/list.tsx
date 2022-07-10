import React from 'react';
import styled, { css } from 'styled-components';

import { Tile, Typography } from '@libs/ui';

const TopMarginContainer = styled.div`
  margin-top: 16px;
`;

const SpacedBetweenFlexRox = styled.div`
  display: flex;
  justify-content: space-between;

  margin: 0 16px;
`;

const PointerContainer = styled.div`
  cursor: pointer;
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

interface HeaderAction {
  caption: string;
  onClick: () => void;
}

interface ListProps<T> extends BorderBottomPseudoElementProps {
  rows: T[];
  renderRow: (rowData: T) => JSX.Element;
  renderFooter?: () => JSX.Element;
  headerLabel?: string;
  headerAction?: HeaderAction;
}

export function List<T>({
  rows,
  renderRow,
  marginLeftForItemSeparatorLine,
  renderFooter,
  headerLabel,
  headerAction
}: ListProps<T>) {
  return (
    <>
      {headerLabel && (
        <TopMarginContainer>
          <SpacedBetweenFlexRox>
            <Typography type="label" weight="medium" color="contentSecondary">
              {headerLabel}
            </Typography>
            {headerAction && (
              <PointerContainer>
                <Typography
                  type="label"
                  weight="medium"
                  color="contentBlue"
                  onClick={headerAction.onClick}
                >
                  {headerAction.caption}
                </Typography>
              </PointerContainer>
            )}
          </SpacedBetweenFlexRox>
        </TopMarginContainer>
      )}
      <TopMarginContainer>
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
      </TopMarginContainer>
    </>
  );
}
