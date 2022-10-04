import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled, { css } from 'styled-components';

import {
  CenteredFlexColumn,
  AlignedFlexRow,
  FlexColumn,
  FlexRow
} from '@libs/layout';
import { CopyToClipboard, SvgIcon, Typography, hexToRGBA } from '@libs/ui';

import { WordType } from '@src/apps/onboarding/types';

import { Word } from '../word';

const allCornersBorderRadius = css`
  border-radius: 12px;
`;

const topCornersBorderRadius = css`
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
`;

const PhraseBoardContainer = styled(FlexColumn)`
  margin-top: 24px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  position: relative;

  ${allCornersBorderRadius};
`;

interface WithCopyToClipboardControls {
  withCopyToClipboardControls?: boolean;
}

const BlurredPhraseBoardOverlayContainer = styled(
  CenteredFlexColumn
)<WithCopyToClipboardControls>`
  justify-content: center;

  position: absolute;

  height: ${({ withCopyToClipboardControls }) =>
    withCopyToClipboardControls ? 'calc(100% - 56px)' : '100%'};
  width: 100%;
  max-width: 448px;

  background-color: ${({ theme }) => hexToRGBA(theme.color.black, '.32')};
  backdrop-filter: blur(8px);

  ${({ withCopyToClipboardControls }) =>
    withCopyToClipboardControls
      ? topCornersBorderRadius
      : allCornersBorderRadius};

  cursor: pointer;
`;

const TextAndIconContainer = styled(CenteredFlexColumn)`
  gap: 10px;
`;

const WordListContainer = styled(FlexRow)`
  align-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;

  padding: ${({ theme }) => theme.padding[1.6]};
`;

const CopySecretPhraseContainer = styled(AlignedFlexRow)`
  height: 56px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => `0 ${theme.padding[1.6]}`};
`;

const CopySecretPhraseStatusContainer = styled(FlexRow)`
  gap: 4px;
`;

const CopySecretPhraseClickableContainer = styled(
  CopySecretPhraseStatusContainer
)`
  cursor: pointer;
`;

interface PhraseBoardProps extends WithCopyToClipboardControls {
  phrase: WordType[];
  withHiddenContentOnStart?: boolean;
}

export function PhraseBoard({
  phrase,
  withCopyToClipboardControls,
  withHiddenContentOnStart
}: PhraseBoardProps) {
  const { t } = useTranslation();
  const [isBlurred, setIsBlurred] = useState(true);

  const orderedPhrase = phrase.sort((a, b) => (a.order < b.order ? -1 : 1));
  const secretPhraseForCopy = orderedPhrase.map(({ word }) => word).join(' ');

  return (
    <PhraseBoardContainer>
      {withHiddenContentOnStart && isBlurred && (
        <BlurredPhraseBoardOverlayContainer
          withCopyToClipboardControls={withCopyToClipboardControls}
          onClick={() => setIsBlurred(false)}
        >
          <TextAndIconContainer>
            <SvgIcon
              src="assets/icons/lock.svg"
              size={24}
              color="contentOnFill"
            />
            <Typography type="captionMedium" color="contentOnFill">
              <Trans t={t}>Click to reveal secret phrase</Trans>
            </Typography>
          </TextAndIconContainer>
        </BlurredPhraseBoardOverlayContainer>
      )}
      <WordListContainer>
        {phrase.map(({ word, order, isHighlighted }) => (
          <Word
            key={order}
            word={word}
            order={order}
            isHighlighted={isHighlighted}
          />
        ))}
      </WordListContainer>
      {withCopyToClipboardControls && (
        <CopySecretPhraseContainer>
          <CopyToClipboard
            renderClickableComponent={() => (
              <CopySecretPhraseClickableContainer>
                <SvgIcon
                  src="assets/icons/copy.svg"
                  size={24}
                  color="contentBlue"
                />
                <Typography type="captionMedium" color="contentBlue">
                  <Trans t={t}>Copy secret phrase</Trans>
                </Typography>
              </CopySecretPhraseClickableContainer>
            )}
            renderStatusComponent={() => (
              <CopySecretPhraseStatusContainer>
                <SvgIcon
                  src="assets/icons/checkbox-checked.svg"
                  size={24}
                  color="contentGreen"
                />
                <Typography type="captionMedium" color="contentGreen">
                  <Trans t={t}>Copied to clipboard for 1 min</Trans>
                </Typography>
              </CopySecretPhraseStatusContainer>
            )}
            value={secretPhraseForCopy}
          />
        </CopySecretPhraseContainer>
      )}
    </PhraseBoardContainer>
  );
}
