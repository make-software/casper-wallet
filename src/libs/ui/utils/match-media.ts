import * as CSS from 'csstype';
import facepaint from 'facepaint';
import { useEffect, useState } from 'react';
import { CSSObject } from 'styled-components';

export const Breakpoints = {
  // there is NO "mobile breakpoint", because in mobile first
  // styles for mobile are defined by default without media
  tablet: 768,
  laptop: 1024,
  desktop: 1280
};

export const MediaQueries = {
  // mobile: `(max-width:${Breakpoints['tablet'] - 1}px)`,
  tablet: `(min-width:${Breakpoints['tablet']}px)`,
  laptop: `(min-width:${Breakpoints['laptop']}px)`,
  desktop: `(min-width:${Breakpoints['desktop']}px)`
};

type CSSPropertiesMulti = {
  [P in keyof CSS.Properties<string | number>]:
    | CSS.Properties<string | number>[P]
    | CSS.Properties<string | number>[P][];
};
type CSSPseudos = { [K in CSS.Pseudos]?: CSSObjectMulti };

interface CSSObjectMulti extends CSSPropertiesMulti, CSSPseudos {
  [key: string]:
    | Array<CSSObjectMulti | string | number | undefined>
    | CSSObjectMulti
    | string
    | number
    | undefined;
}

/** withMedia helper
 * @usage
 * ```
 * const StyledImg = styled.img(({ theme }) => theme.withMedia({
 *   display: ['mobileValue', 'tabletValue', 'laptopValue', 'desktopValue'],
 * }));
 * ```
 */
export const withMedia: (styled: CSSObjectMulti) => CSSObject = facepaint([
  `@media ${MediaQueries['tablet']}`,
  `@media ${MediaQueries['laptop']}`,
  `@media ${MediaQueries['desktop']}`
]) as any;

/** useMatchMedia helper
 * @usage
 * ```
 * const responsiveType = useMatchMedia(['mobile', 'tablet', 'laptop or desktop'], [deps])
 * <div>{responsiveType}</div>
 * ```
 */
export const useMatchMedia = <T extends any>(
  [onMobile, onTablet, onLaptop, onDesktop]: [T, T?, T?, T?],
  dependencies: any[]
) => {
  const queries = [
    MediaQueries['desktop'],
    MediaQueries['laptop'],
    MediaQueries['tablet']
  ];

  const mediaQueryLists = queries.map(q => window.matchMedia(q));

  const getMatchArg = () => {
    // get index of first media query that matches
    const index = mediaQueryLists.findIndex(mql => mql.matches);
    // return passed value or mobile when no match
    return (
      [onDesktop ?? onLaptop ?? onTablet, onLaptop ?? onTablet, onTablet]?.[
        index
      ] ?? onMobile
    );
  };

  const [match, setMatch] = useState<T>(getMatchArg);

  useEffect(() => {
    const handler = () => setMatch(getMatchArg);
    handler();
    // Add listeners to media queries
    mediaQueryLists.forEach(mql => mql.addListener(handler));
    // Remove listeners on cleanup
    return () => mediaQueryLists.forEach(mql => mql.removeListener(handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return match;
};
