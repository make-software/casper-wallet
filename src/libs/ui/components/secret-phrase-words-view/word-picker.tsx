import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { FlexRow } from '@src/libs/layout';
import { BaseProps, WordTag } from '@src/libs/ui';
import { SecretPhrase } from '@src/libs/crypto';

import { getWordsIndexListWithExtraIndexForPicker } from './utils';

const WordPickerContainer = styled(FlexRow)`
  flex-wrap: wrap;
  gap: 7px;

  color: ${({ theme }) => theme.color.contentBlue};
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;

  padding: ${({ theme }) => theme.padding['1.6']};
`;

interface WordPickerProps extends BaseProps {
  phrase: SecretPhrase;
  hiddenWordIndexes: number[];
  selectedHiddenWordIndexes: number[];
  onHiddenWordClick: (index: number) => void;
}

export function WordPicker({
  phrase,
  hiddenWordIndexes,
  selectedHiddenWordIndexes,
  onHiddenWordClick,
  dataTestId
}: WordPickerProps) {
  const [wordsIndexList, setWordsIndexList] = useState<number[]>([]);

  useEffect(() => {
    const wordsIndexListWithExtraIndex =
      getWordsIndexListWithExtraIndexForPicker(phrase, hiddenWordIndexes);

    setWordsIndexList(wordsIndexListWithExtraIndex);
  }, [hiddenWordIndexes, phrase]);

  return (
    <WordPickerContainer data-testid={dataTestId}>
      {wordsIndexList.map(wordIndex => (
        <WordTag
          key={wordIndex}
          value={phrase[wordIndex]}
          index={wordIndex}
          hideIndex
          onHiddenWordClick={onHiddenWordClick}
          disabled={selectedHiddenWordIndexes.includes(wordIndex)}
        />
      ))}
    </WordPickerContainer>
  );
}
