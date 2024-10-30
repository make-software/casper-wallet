import { SecretPhrase } from '@libs/crypto';

import { PartialPhraseArray } from './types';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function shuffle(list: number[]) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

interface WordCollections {
  initialHiddenWordIndexes: number[];
  initialPartialPhrase: PartialPhraseArray;
  extraWordIndex: number;
}

export function buildInitialWordsCollection(
  phrase: SecretPhrase
): WordCollections {
  const collectionSize = 7;
  const hiddenWordsCount = collectionSize - 1;
  const initialHiddenWordIndexes: number[] = [];
  const initialPartialPhrase: PartialPhraseArray = [...phrase];

  let i = 0;

  while (i < collectionSize) {
    const index = getRandomInt(0, phrase.length - 1);

    if (initialPartialPhrase[index] != null) {
      initialHiddenWordIndexes.push(index);
      if (i < hiddenWordsCount) {
        initialPartialPhrase[index] = null;
      }

      i++;
    }
  }
  const extraWordIndex = initialHiddenWordIndexes[6];

  shuffle(initialHiddenWordIndexes);

  return { initialHiddenWordIndexes, initialPartialPhrase, extraWordIndex };
}
