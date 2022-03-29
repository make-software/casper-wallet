import { MatcherFunction } from '@testing-library/react';

type Query = (f: MatcherFunction) => HTMLElement;

export const withMarkup =
  (query: Query) =>
  (text: string): HTMLElement =>
    query((content: string, node: Element | null): boolean => {
      if (!node) {
        return false;
      }

      const hasText = (node: Element) => node.textContent === text;
      const childrenDontHaveText = Array.from(node.children).every(
        child => !hasText(child)
      );

      return hasText(node) && childrenDontHaveText;
    });
