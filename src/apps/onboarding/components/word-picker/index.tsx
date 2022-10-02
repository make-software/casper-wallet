import React from 'react';
import styled from 'styled-components';

import { FlexRow } from '@libs/layout';

import { WordType } from '@src/apps/onboarding/types';
import { Word } from '@src/apps/onboarding/components/word';

const WordPickerContainer = styled(FlexRow)`
  gap: 7px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: 12px;

  margin-top: 24px;
  padding: ${({ theme }) => theme.padding['1.6']};
`;

interface WordPickerProps {
  words: WordType[];
}

export function WordPicker({ words }: WordPickerProps) {
  return (
    <WordPickerContainer>
      {words.map(({ word, order }) => (
        <Word
          key={order}
          word={word}
          order={order}
          color="contentBlue"
          hideOrder
        />
      ))}
    </WordPickerContainer>
  );
}
