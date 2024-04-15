import React from 'react';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { List, SvgIcon, Typography } from '@libs/ui/components';

const ItemContainer = styled(AlignedFlexRow)<{ withDescription: boolean }>`
  padding: ${({ withDescription }) => (withDescription ? '8px 16px' : '16px')};
`;

type ListType = {
  id: number;
  header: string;
  description?: string;
  icon?: string;
};
interface TipsProps {
  label?: string;
  list: ListType[];
  contentTop?: SpacingSize;
}

export const Tips = ({ list, label, contentTop }: TipsProps) => (
  <List
    contentTop={contentTop}
    headerLabel={label}
    headerLabelTop={SpacingSize.XXXL}
    rows={list}
    renderRow={({ header, description, icon }) => (
      <ItemContainer gap={SpacingSize.Large} withDescription={!!description}>
        <SvgIcon
          src={icon || 'assets/icons/radio-button-on.svg'}
          size={24}
          color="contentAction"
        />
        <LeftAlignedFlexColumn>
          <Typography type="body">{header}</Typography>
          {description && (
            <Typography type="listSubtext" color="contentSecondary">
              {description}
            </Typography>
          )}
        </LeftAlignedFlexColumn>
      </ItemContainer>
    )}
    marginLeftForItemSeparatorLine={54}
  />
);
