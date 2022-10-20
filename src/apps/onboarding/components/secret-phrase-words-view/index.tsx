import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState
} from 'react';
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
import { PartialPhraseArray } from './types';
import { buildInitialWordsCollection } from './utils';

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
  phrase: string[];
  hiddenWordIndexes: number[];
  selectedHiddenWordIndexes: number[];
  onHiddenWordClick: (index: number) => void;
}

interface RenderFooterProps {
  secretPhraseForCopy: string;
}

interface SecretPhraseWordsViewProps {
  phrase: string[];
  confirmationMode?: boolean;
  setIsFormValid?: Dispatch<SetStateAction<boolean>>;
  setIsConfirmationSuccess?: Dispatch<SetStateAction<boolean>>;
  renderHeader?: (props: RenderHeaderProps) => JSX.Element;
  renderFooter?: (props: RenderFooterProps) => JSX.Element;
}

export function SecretPhraseWordsView({
  phrase,
  confirmationMode,
  renderHeader,
  renderFooter,
  setIsFormValid,
  setIsConfirmationSuccess
}: SecretPhraseWordsViewProps) {
  const secretPhraseString = phrase.map(word => word).join(' ');

  const { t } = useTranslation();
  const [isBlurred, setIsBlurred] = useState(true);
  const [hiddenWordIndexes, setHiddenWordIndexes] = useState<number[]>([]);
  const [partialPhrase, setPartialPhrase] = useState<PartialPhraseArray>([]);
  const [selectedHiddenWordIndexes, setSelectedHiddenWordIndexes] = useState<
    number[]
  >([]);

  const strPhrase = phrase.toString();
  const { initialPartialPhrase, initialHiddenWordIndexes } = useMemo(
    () => buildInitialWordsCollection(phrase),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [strPhrase]
  );

  if (partialPhrase.length === 0) {
    setPartialPhrase(initialPartialPhrase);
  }

  if (hiddenWordIndexes.length === 0) {
    setHiddenWordIndexes(initialHiddenWordIndexes);
  }

  useEffect(() => {
    if (
      !confirmationMode ||
      setIsFormValid == null ||
      setIsConfirmationSuccess == null
    ) {
      return;
    }

    const isFormValid = !partialPhrase.includes(null);
    setIsFormValid(isFormValid);

    if (isFormValid) {
      const enteredPhraseString = partialPhrase.join(' ');
      setIsConfirmationSuccess(secretPhraseString === enteredPhraseString);
    }
  }, [
    partialPhrase,
    secretPhraseString,
    confirmationMode,
    setIsFormValid,
    setIsConfirmationSuccess
  ]);

  const onHiddenWordClick = (index: number): void => {
    setPartialPhrase(prevPartialPhrase => {
      const firstHiddenWordIndex = partialPhrase.findIndex(
        word => word === null
      );

      return prevPartialPhrase.map((word, wordIndex) =>
        wordIndex === firstHiddenWordIndex ? phrase[index] : word
      );
    });

    setSelectedHiddenWordIndexes(prevSelectedWordIndexes => [
      ...prevSelectedWordIndexes,
      index
    ]);
  };

  return (
    <SecretPhraseWordsViewContainer>
      {confirmationMode && renderHeader != null && (
        <HeaderContainer>
          {renderHeader({
            phrase,
            hiddenWordIndexes,
            selectedHiddenWordIndexes,
            onHiddenWordClick
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
          {(confirmationMode ? partialPhrase : phrase).map((word, index) => {
            return (
              <WordTag
                key={`${index}-${word}`}
                value={word}
                index={index}
                selected={
                  confirmationMode &&
                  hiddenWordIndexes.includes(index) &&
                  partialPhrase[index] != null
                }
              />
            );
          })}
        </WordListContainer>
        {renderFooter != null && (
          <FooterContainer>
            {renderFooter({ secretPhraseForCopy: secretPhraseString })}
          </FooterContainer>
        )}
      </WordListAndFooterContainer>
    </SecretPhraseWordsViewContainer>
  );
}
