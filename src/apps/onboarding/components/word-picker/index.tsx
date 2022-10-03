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
  words: string[];
  selectedWords: string[];
  onRemovedWordClick: (value: string) => void;
}

export function WordPicker({
  words,
  selectedWords,
  onRemovedWordClick
}: WordPickerProps) {
  return (
    <WordPickerContainer>
      {words.map((word, index) => (
        <WordTag
          key={`${index}-${word}`}
          value={word}
          index={index + 1}
          hideIndex
          onRemovedWordClick={onRemovedWordClick}
          disabled={selectedWords.includes(word)}
        />
      ))}
    </WordPickerContainer>
  );
}
