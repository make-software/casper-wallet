import React from 'react';
import styled from 'styled-components';

import { FlexRow } from '@src/libs/layout';
import { BaseProps, WordTag } from '@src/libs/ui';
import { SecretPhrase } from '@src/libs/crypto';

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
  return (
    <WordPickerContainer data-testid={dataTestId}>
      {hiddenWordIndexes.map(wordIndex => (
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
