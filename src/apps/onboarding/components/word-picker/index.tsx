import React from 'react';
import styled from 'styled-components';

import { FlexRow } from '@libs/layout';

import { WordTag } from '../word-tag';

const WordPickerContainer = styled(FlexRow)`
  gap: 7px;

  color: ${({ theme }) => theme.color.contentBlue};
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;

  padding: ${({ theme }) => theme.padding['1.6']};
`;

interface WordPickerProps {
  phrase: string[];
  hiddenWordIndexes: number[];
  disabledWordIndexes: number[];
  onHiddenWordClick: (index: number) => void;
}

export function WordPicker({
  phrase,
  hiddenWordIndexes,
  disabledWordIndexes,
  onHiddenWordClick
}: WordPickerProps) {
  return (
    <WordPickerContainer>
      {hiddenWordIndexes.map(wordIndex => (
        <WordTag
          key={wordIndex}
          value={phrase[wordIndex]}
          index={wordIndex}
          hideIndex
          onHiddenWordClick={onHiddenWordClick}
          disabled={disabledWordIndexes.includes(wordIndex)}
        />
      ))}
    </WordPickerContainer>
  );
}
