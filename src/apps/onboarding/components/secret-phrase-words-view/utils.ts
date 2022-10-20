import { PartialPhraseArray } from './types';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

interface WordCollections {
  initialHiddenWordIndexes: number[];
  initialPartialPhrase: PartialPhraseArray;
}

export function buildInitialWordsCollection(phrase: string[]): WordCollections {
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
