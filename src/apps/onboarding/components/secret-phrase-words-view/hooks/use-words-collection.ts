import { Dispatch, SetStateAction, useEffect, useState } from 'react';

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

interface WordCollections {
  removedWords: string[];
  partialWords: (string | null)[];
}

function buildWordsCollection(phrase: string[]): WordCollections {
  const collectionSize = 6;
  const removedWords: string[] = [];
  const partialWords: (string | null)[] = [...phrase];

  let i = 0;

  while (i < collectionSize) {
    const index = getRandomInt(0, phrase.length - 1);

    if (partialWords[index] != null) {
      removedWords.push(partialWords[index] as string);
      partialWords[index] = null;

      i++;
    }
  }

  return { removedWords, partialWords };
}

interface UseWordsCollectionResult extends WordCollections {
  selectedWords: string[];
  setSelectedWords: Dispatch<SetStateAction<string[]>>;
  setPartialWords: Dispatch<SetStateAction<(string | null)[]>>;
}

export function useWordsCollection(phrase: string[]): UseWordsCollectionResult {
  const [removedWords, setRemovedWords] = useState<string[]>([]);
  const [partialWords, setPartialWords] = useState<(string | null)[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  useEffect(() => {
    const { removedWords, partialWords } = buildWordsCollection(phrase);
    setPartialWords(partialWords);
    setRemovedWords(removedWords);
  }, []);

  return {
    removedWords,
    partialWords,
    selectedWords,
    setPartialWords,
    setSelectedWords
  };
}
