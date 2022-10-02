import React from 'react';
import styled from 'styled-components';

import { Typography } from '@libs/ui';

const UnorderedList = styled.ul`
  padding-inline-start: unset;
  list-style-type: none;

  line-height: 3rem;

  padding-left: 1.9rem;
  text-indent: -1.9rem;
`;

const ListItem = styled.li`
  &::before {
    content: '•';

    font-size: 15px;
    color: ${({ theme }) => theme.color.contentSecondary};
    margin-right: 10px;
  }
`;

interface TextListItem {
  id: number | string;
  content: string;
}

interface TextListProps {
  textListItems: TextListItem[];
}

export function TextList({ textListItems }: TextListProps) {
  return (
    <UnorderedList>
      {textListItems.map(({ id, content }) => (
        <ListItem key={id}>
          <Typography type="body" color="contentSecondary">
            {content}
          </Typography>
        </ListItem>
      ))}
    </UnorderedList>
  );
}
