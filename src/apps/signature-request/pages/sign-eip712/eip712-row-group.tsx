import React from 'react';
import styled from 'styled-components';

import {
  BorderBottomPseudoElementProps,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

import { Eip712DisplayRow } from './eip712-display-row';
import { Eip712RowItem } from './group-eip712-rows';

// Sticky within the group's own box, so a field's struct stays named while any of its rows is visible.
// The card's own colour, so it reads as plain text yet hides rows scrolling beneath it.
const GroupHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 16px;
  background: ${({ theme }) => theme.color.backgroundPrimary};
`;

const GroupRows = styled.div<BorderBottomPseudoElementProps>`
  & > * + *:before {
    ${borderBottomPseudoElementRules};
  }
`;

const GroupRow = styled.div`
  display: flex;
  flex-direction: column;
`;

interface Eip712RowGroupProps {
  label: string;
  items: Eip712RowItem[];
}

export function Eip712RowGroup({ label, items }: Eip712RowGroupProps) {
  return (
    <>
      <GroupHeader>
        <Typography type="bodySemiBold" color="contentPrimary">
          {label}
        </Typography>
      </GroupHeader>
      <GroupRows marginLeftForSeparatorLine={16}>
        {items.map(({ row, label }, index) => (
          <GroupRow key={`${index}-${label}`}>
            <Eip712DisplayRow row={row} label={label} />
          </GroupRow>
        ))}
      </GroupRows>
    </>
  );
}
