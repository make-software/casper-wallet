import React from 'react';
import styled from 'styled-components';

import { Tile } from '../tile/tile';
import { ListItem, OnClickHandler, ListItemType } from './list-item';

const Container = styled.div`
  margin: 24px 0;
`;

export interface Item {
  id: number | string;
  item: ListItemType;
  onClick?: OnClickHandler;
  leftOnClick?: OnClickHandler;
  contentOnClick?: OnClickHandler;
  rightOnClick?: OnClickHandler;
}

interface ListProps {
  items: Item[];
}

export function List({ items }: ListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Container>
      <Tile>
        {items.map(({ id, ...restProps }) => (
          <ListItem key={id} {...restProps} />
        ))}
      </Tile>
    </Container>
  );
}
