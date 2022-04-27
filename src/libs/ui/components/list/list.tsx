import React, { ReactElement } from 'react';

import { Tile } from '../tile/tile';
import { ListItem } from './list-item';

interface ListItemType {
  Content: ReactElement;
  Left?: ReactElement;
  Right?: ReactElement;
}

export interface Item {
  id: number | string;
  item: ListItemType;
  value: number;
}

interface ListProps {
  items: Item[];
}

export function List({ items }: ListProps) {
  if (items.length > 0) {
    return (
      <Tile>
        {items.map(({ id, item }) => (
          <ListItem key={id} {...item} />
        ))}
      </Tile>
    );
  }

  throw new Error('List is empty');
}
