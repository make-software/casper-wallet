import { SecretPhrase } from '@src/libs/crypto';
import { PartialPhraseArray } from './types';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function shuffle(list: number[]) {
  for (let i = list.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

interface WordCollections {
  initialHiddenWordIndexes: number[];
  initialPartialPhrase: PartialPhraseArray;
}

export function buildInitialWordsCollection(
  phrase: SecretPhrase
): WordCollections {
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
}

export const getWordsIndexListWithExtraIndexForPicker = (
  phrase: SecretPhrase,
  hiddenWordIndexes: number[]
) => {
  const extraWordsIndex: number[] = [];

  while (extraWordsIndex.length !== 6) {
    const index = getRandomInt(0, phrase.length - 1);

    if (
      !hiddenWordIndexes.includes(index) &&
      !extraWordsIndex.includes(index)
    ) {
      extraWordsIndex.push(index);
    }
  }

  const combinedWordsIndexList = [...hiddenWordIndexes, ...extraWordsIndex];

  shuffle(combinedWordsIndexList);

  return combinedWordsIndexList;
};
