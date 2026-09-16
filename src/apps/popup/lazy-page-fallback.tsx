import React from 'react';

import { HeaderPopup, PopupLayout } from '@libs/layout';

/**
 * Shown while a route's chunk loads — in practice only on the initial mount of a
 * deep-linked window; in-app navigation keeps its boundary mounted. Frame and nothing
 * else: the password prompt it precedes has a bare header, so skeleton bars would
 * flash a shape that never arrives.
 */
export const LazyPageFallback = () => (
  <PopupLayout
    renderHeader={() => <HeaderPopup />}
    renderContent={() => <></>}
  />
);
