import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled, { css } from 'styled-components';

import {
  CenteredFlexColumn,
  AlignedFlexRow,
  FlexColumn,
  FlexRow
} from '@libs/layout';
import { SvgIcon, Typography, hexToRGBA } from '@libs/ui';

import { WordTag } from '../word-tag';

import { useWordsCollection } from './hooks/use-words-collection';

const allCornersBorderRadius = css`
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;
`;

const topCornersBorderRadius = css`
  border-top-left-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.twelve}px;
`;

const HeaderContainer = styled.div`
  margin-bottom: 16px;
`;

const FooterContainer = styled(AlignedFlexRow)`
  height: 56px;
  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => `0 ${theme.padding[1.6]}`};
`;

const SecretPhraseWordsViewContainer = styled(FlexColumn)`
  margin-top: 24px;
`;

interface WithFooter {
  withFooter?: boolean;
}

const BlurredSecretPhraseWordsViewOverlayContainer = styled(
  CenteredFlexColumn
)<WithFooter>`
  justify-content: center;

  position: absolute;

  height: ${({ withFooter }) => (withFooter ? 'calc(100% - 56px)' : '100%')};
  width: 100%;
  max-width: 448px;

  background-color: ${({ theme }) => hexToRGBA(theme.color.black, '.32')};
  backdrop-filter: blur(8px);

  ${({ withFooter }) =>
    withFooter ? topCornersBorderRadius : allCornersBorderRadius};

  cursor: pointer;
`;

const WordListAndFooterContainer = styled.div`
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  position: relative;

  ${allCornersBorderRadius};
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

interface RenderHeaderProps {
  removedWords: string[];
  selectedWords: string[];
  onRemovedWordClick: (value: string) => void;
}

interface RenderFooterProps {
  secretPhraseForCopy: string;
}

interface SecretPhraseWordsViewProps {
  phrase: string[];
  confirmationMode?: boolean;
  renderHeader?: (props: RenderHeaderProps) => JSX.Element;
  renderFooter?: (props: RenderFooterProps) => JSX.Element;
}

export function SecretPhraseWordsView({
  phrase,
  confirmationMode,
  renderHeader,
  renderFooter
}: SecretPhraseWordsViewProps) {
  const { t } = useTranslation();
  const [isBlurred, setIsBlurred] = useState(true);
  const {
    removedWords,
    partialWords,
    selectedWords,
    setPartialWords,
    setSelectedWords
  } = useWordsCollection(phrase);

  const onRemovedWordClick = (value: string): void => {
    setSelectedWords(prevSelectedWords => [...prevSelectedWords, value]);
    setPartialWords(prevPartialWords => {
      const nearestRemovedWordIndex = partialWords.findIndex(
        word => word === null
      );

      return prevPartialWords.map((word, index) =>
        index === nearestRemovedWordIndex ? value : word
      );
    });
  };

  const secretPhraseForCopy = phrase.map(word => word).join(' ');

  return (
    <SecretPhraseWordsViewContainer>
      {confirmationMode && renderHeader != null && (
        <HeaderContainer>
          {renderHeader({
            removedWords,
            selectedWords,
            onRemovedWordClick
          })}
        </HeaderContainer>
      )}
      <WordListAndFooterContainer>
        {!confirmationMode && isBlurred && (
          <BlurredSecretPhraseWordsViewOverlayContainer
            withFooter={renderFooter != null}
            onClick={() => setIsBlurred(false)}
          >
            <TextAndIconContainer>
              <SvgIcon src="assets/icons/lock.svg" color="contentOnFill" />
              <Typography type="captionMedium" color="contentOnFill">
                <Trans t={t}>Click to reveal secret phrase</Trans>
              </Typography>
            </TextAndIconContainer>
          </BlurredSecretPhraseWordsViewOverlayContainer>
        )}
        <WordListContainer>
          {(confirmationMode ? partialWords : phrase).map((word, index) => (
            <WordTag key={`${index}-${word}`} value={word} index={index + 1} />
          ))}
        </WordListContainer>
        {renderFooter != null && (
          <FooterContainer>
            {renderFooter({ secretPhraseForCopy })}
          </FooterContainer>
        )}
      </WordListAndFooterContainer>
    </SecretPhraseWordsViewContainer>
  );
}
