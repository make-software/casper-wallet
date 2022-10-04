import React from 'react';
import styled from 'styled-components';
import { Typography } from '@libs/ui';
import { FlexRow } from '@libs/layout';

interface IsEmptyWord {
  isEmptyWord?: boolean;
}

type DisabledOrSelected = Pick<WordTagProps, 'selected' | 'disabled'>;

const WordContainer = styled(FlexRow)<DisabledOrSelected & IsEmptyWord>`
  gap: 4px;
  padding: 2px 8px;
  width: ${({ isEmptyWord }) => (isEmptyWord ? '72px' : 'unset')};
  background: ${({ theme, selected }) =>
    selected
      ? theme.color.backgroundBlue
      : `linear-gradient(
        ${theme.color.fillGradientOut.from},
        ${theme.color.fillGradientOut.to}
  )`};
  color: ${({ theme, disabled, selected }) =>
    disabled
      ? theme.color.contentSecondary
      : selected
      ? theme.color.contentOnFill
      : 'inherit'};
  border-radius: 6px;
  cursor: ${({ onClick, disabled }) =>
    onClick && !disabled ? 'pointer' : 'auto'};
`;

interface WordTagProps {
  value: string | null;
  index: number;
  hideIndex?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

export function WordTag({
  value,
  index,
  disabled,
  selected,
  hideIndex
}: WordTagProps) {
  return (
    <WordContainer
      disabled={disabled}
      selected={selected}
      isEmptyWord={value == null}
    >
      {!hideIndex && (
        <Typography
          type="labelMedium"
          color={selected ? 'inherit' : 'contentSecondary'}
        >
          {index}
        </Typography>
      )}
      <Typography type="body">{value}</Typography>
    </WordContainer>
  );
}
