import React from 'react';
import styled from 'styled-components';

import { FlexRow } from '@libs/layout';

import { WordTag } from '../word-tag';

const WordPickerContainer = styled(FlexRow)`
  gap: 7px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: 12px;

  padding: ${({ theme }) => theme.padding['1.6']};
`;

interface WordPickerProps {
  words: string[];
}

export function WordPicker({ words }: WordPickerProps) {
  return (
    <WordPickerContainer>
      {words.map((word, index) => (
        <WordTag
          key={`${index}-${word}`}
          value={word}
          order={index + 1}
          color="contentBlue"
          hideOrder
        />
      ))}
    </WordPickerContainer>
  );
}
