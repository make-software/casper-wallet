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
const GroupHeader = styled.div<{ isFirst: boolean }>`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 16px;
  background: ${({ theme }) => theme.color.fillNeutral};
  border-radius: ${({ theme, isFirst }) =>
    isFirst
      ? `${theme.borderRadius.twelve}px ${theme.borderRadius.twelve}px 0 0`
      : '0'};
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
  isFirst: boolean;
}

export function Eip712RowGroup({ label, items, isFirst }: Eip712RowGroupProps) {
  return (
    <>
      <GroupHeader isFirst={isFirst}>
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
