import React, { ReactElement } from 'react';
import styled from 'styled-components';

const ContentContainer = styled.div`
  width: 100%;
  margin-left: 16px;

  display: flex;
  justify-content: space-between;
`;

const Container = styled.div`
  display: flex;

  & ${ContentContainer} {
    border-bottom: 1px solid ${({ theme }) => theme.color.borderPrimary};
  }

  &:last-child ${ContentContainer} {
    border-bottom: none;
  }
`;

interface ListItemProps {
  Content: ReactElement;
  Left?: ReactElement;
  Right?: ReactElement;
}

export function ListItem({ Left, Content, Right }: ListItemProps) {
  return (
    <Container>
      {Left && Left}
      <ContentContainer>
        {Content}
        {Right && Right}
      </ContentContainer>
    </Container>
  );
}
