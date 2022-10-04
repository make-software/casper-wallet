import React from 'react';
import styled from 'styled-components';
import { Typography } from '@libs/ui';
import { FlexRow } from '@libs/layout';

interface WordContainerProps {
  color?: 'contentBlue' | 'contentPrimary' | 'contentSecondary';
  isHighlighted?: boolean;
}

interface IsEmptyWord {
  isEmptyWord?: boolean;
}

const WordContainer = styled(FlexRow)<WordContainerProps & IsEmptyWord>`
  gap: 4px;
  padding: 2px 8px;

  width: ${({ isEmptyWord }) => (isEmptyWord ? '72px' : 'unset')};

  background: ${({ theme, isHighlighted }) =>
    isHighlighted
      ? theme.color.backgroundBlue
      : `linear-gradient(
        ${theme.color.fillGradientOut.from},
        ${theme.color.fillGradientOut.to}
  )`};
  color: ${({ theme, color, isHighlighted }) =>
    isHighlighted
      ? theme.color.contentOnFill
      : color != null
      ? theme.color[color]
      : 'inherit'};

  border-radius: 6px;
`;

interface WordTagProps extends WordContainerProps {
  value: string | null;
  order: number;
  hideOrder?: boolean;
}

export function WordTag({
  value,
  order,
  color = 'contentPrimary',
  isHighlighted,
  hideOrder
}: WordTagProps) {
  return (
    <WordContainer
      color={color}
      isHighlighted={isHighlighted}
      isEmptyWord={value == null}
    >
      {!hideOrder && (
        <Typography
          type="labelMedium"
          color={!isHighlighted ? 'contentSecondary' : 'inherit'}
        >
          {order}
        </Typography>
      )}
      <Typography type="body">{value}</Typography>
    </WordContainer>
  );
}
