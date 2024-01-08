import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SecretPhrase } from '@libs/crypto';
import { AlignedFlexRow, FlexColumn, FlexRow, SpacingSize } from '@libs/layout';
import { BaseProps, SvgIcon, Typography, WordTag } from '@libs/ui';

const WordPickerContainer = styled(FlexColumn)`
  color: ${({ theme }) => theme.color.contentAction};
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;

  padding: ${({ theme }) => theme.padding['1.6']};
`;

const ResetContainer = styled(AlignedFlexRow)`
  cursor: pointer;
  width: fit-content;
`;

interface WordPickerProps extends BaseProps {
  phrase: SecretPhrase;
  hiddenWordIndexes: number[];
  selectedHiddenWordIndexes: number[];
  onHiddenWordClick: (index: number) => void;
  handleResetPhrase: () => void;
}

export function WordPicker({
  phrase,
  hiddenWordIndexes,
  selectedHiddenWordIndexes,
  onHiddenWordClick,
  dataTestId,
  handleResetPhrase
}: WordPickerProps) {
  const { t } = useTranslation();

  return (
    <WordPickerContainer gap={SpacingSize.Large} data-testid={dataTestId}>
      <FlexRow gap={SpacingSize.Small} wrap="wrap">
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
      </FlexRow>
      <ResetContainer
        gap={SpacingSize.Small}
        onClick={() => handleResetPhrase()}
      >
        <SvgIcon src="assets/icons/reset.svg" color="contentAction" />
        <Typography type="bodySemiBold" color="contentAction">
          <Trans t={t}>Reset</Trans>
        </Typography>
      </ResetContainer>
    </WordPickerContainer>
  );
}
