import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { Tile } from '../tile/tile';

export const ListItemElementContainer = styled.div`
  min-height: 50px;
  height: 100%;

  display: flex;
  align-items: center;
  gap: 10px;

  & > span {
    white-space: nowrap;
  }
`;

export const ListContainer = styled.div`
  margin: 24px 0 0;
`;

const ClickableContainer = styled.div`
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'inherit')};
`;

const LeftContainer = styled(ClickableContainer)`
  padding: 0 16px;
`;

const RightContainer = styled(ClickableContainer)`
  padding: 0 16px;
`;

const ContentContainer = styled(ClickableContainer)`
  width: 100%;
`;

interface MainContainerProps {
  withLeftComponent?: boolean;
}

export const MainContainer = styled.div<MainContainerProps>`
  width: 100%;
  margin-left: ${({ withLeftComponent }) => (withLeftComponent ? 0 : '16px')};

  display: flex;
  justify-content: space-between;
`;

export const ListItemContainer = styled(ClickableContainer)`
  display: flex;

  & ${MainContainer} {
    border-bottom: 1px solid ${({ theme }) => theme.color.borderPrimary};
  }

  &:last-child ${MainContainer} {
    border-bottom: none;
  }
`;

export type OnClickHandler = () => void;

export interface ListItemType {
  id: string | number;
  Content: ReactElement;
  Left?: ReactElement;
  Right?: ReactElement;
  onClick?: OnClickHandler;
  leftOnClick?: OnClickHandler;
  contentOnClick?: OnClickHandler;
  rightOnClick?: OnClickHandler;
}

interface ListProps {
  listItems: ListItemType[];
}

export function List({ listItems }: ListProps) {
  if (listItems.length === 0) {
    return null;
  }

  return (
    <Tile>
      <ListContainer>
        {listItems.map(
          ({
            id,
            Content,
            Right,
            Left,
            onClick,
            contentOnClick,
            rightOnClick,
            leftOnClick
          }) => (
            <ListItemContainer key={id} onClick={onClick}>
              {Left && (
                <LeftContainer onClick={onClick ? undefined : leftOnClick}>
                  {Left}
                </LeftContainer>
              )}
              <MainContainer withLeftComponent={!!Left}>
                <ContentContainer
                  onClick={onClick ? undefined : contentOnClick}
                >
                  {Content}
                </ContentContainer>
                {Right && (
                  <RightContainer onClick={onClick ? undefined : rightOnClick}>
                    {Right}
                  </RightContainer>
                )}
              </MainContainer>
            </ListItemContainer>
          )
        )}
      </ListContainer>
    </Tile>
  );
}
