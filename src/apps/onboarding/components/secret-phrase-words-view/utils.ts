import { PartialPhraseArray } from './types';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

interface WordCollections {
  removedWordIndexes: number[];
  partialPhrase: PartialPhraseArray;
}

export function buildWordsCollection(phrase: string[]): WordCollections {
  const collectionSize = 6;
  const removedWordIndexes: number[] = [];
  const partialPhrase: PartialPhraseArray = [...phrase];

  let i = 0;

  while (i < collectionSize) {
    const index = getRandomInt(0, phrase.length - 1);

    if (partialPhrase[index] != null) {
      removedWordIndexes.push(index);
      partialPhrase[index] = null;

      i++;
    }
  }

  return { removedWordIndexes, partialPhrase };
}
