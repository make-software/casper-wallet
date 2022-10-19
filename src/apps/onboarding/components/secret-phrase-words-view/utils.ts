import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { PartialPhraseArray } from './types';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

interface WordCollections {
  hiddenWordIndexes: number[];
  partialPhrase: PartialPhraseArray;
  setPartialPhrase: Dispatch<SetStateAction<PartialPhraseArray>>;
}

function buildInitialWordsCollection(stringifyPhrase: string) {
  try {
    const phrase = JSON.parse(stringifyPhrase);
    const collectionSize = 6;
    const initialHiddenWordIndexes: number[] = [];
    const initialPartialPhrase: PartialPhraseArray = [...phrase];

    let i = 0;

    while (i < collectionSize) {
      const index = getRandomInt(0, phrase.length - 1);

      if (initialPartialPhrase[index] != null) {
        initialHiddenWordIndexes.push(index);
        initialPartialPhrase[index] = null;

        i++;
      }
    }

    return { initialHiddenWordIndexes, initialPartialPhrase };
  } catch (e) {
    throw e;
  }
}

export function useWordsCollection(stringifyPhrase: string): WordCollections {
  const [hiddenWordIndexes, setHiddenWordIndexes] = useState<number[]>([]);
  const [partialPhrase, setPartialPhrase] = useState<PartialPhraseArray>([]);

  const { initialHiddenWordIndexes, initialPartialPhrase } = useMemo(
    () => buildInitialWordsCollection(stringifyPhrase),
    [stringifyPhrase]
  );

  if (partialPhrase.length === 0 || hiddenWordIndexes.length === 0) {
    setPartialPhrase(initialPartialPhrase);
    setHiddenWordIndexes(initialHiddenWordIndexes);
  }

  return { partialPhrase, setPartialPhrase, hiddenWordIndexes };
}
