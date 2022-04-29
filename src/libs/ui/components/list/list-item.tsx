import React, { ReactElement } from 'react';
import styled from 'styled-components';

const LeftContainer = styled.div``;
const ContentContainer = styled.div`
  width: 100%;
`;
const RightContainer = styled.div``;

const MainContainer = styled.div`
  width: 100%;
  margin-left: 16px;

  display: flex;
  justify-content: space-between;
`;

const Container = styled.div`
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
  Content: ReactElement;
  Left?: ReactElement;
  Right?: ReactElement;
}

interface ListItemProps {
  item: ListItemType;
  onClick?: OnClickHandler;
  leftOnClick?: OnClickHandler;
  contentOnClick?: OnClickHandler;
  rightOnClick?: OnClickHandler;
}

export function ListItem({
  item: { Left, Content, Right },
  onClick,
  leftOnClick,
  contentOnClick,
  rightOnClick
}: ListItemProps) {
  return (
    <Container onClick={onClick}>
      {Left && (
        <LeftContainer onClick={onClick ? undefined : leftOnClick}>
          {Left}
        </LeftContainer>
      )}
      <MainContainer>
        <ContentContainer onClick={onClick ? undefined : contentOnClick}>
          {Content}
        </ContentContainer>
        {Right && (
          <RightContainer onClick={onClick ? undefined : rightOnClick}>
            {Right}
          </RightContainer>
        )}
      </MainContainer>
    </Container>
  );
}
