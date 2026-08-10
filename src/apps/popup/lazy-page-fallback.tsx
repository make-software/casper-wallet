import React from 'react';
import styled from 'styled-components';

import {
  FlexColumn,
  HeaderPopup,
  PopupLayout,
  SpaceBetweenFlexRow
} from '@libs/layout';
import { Skeleton } from '@libs/ui/components';

const Content = styled(FlexColumn)`
  padding: 16px;
  gap: 16px;
`;

/**
 * Shown while a route's chunk is being fetched.
 *
 * In practice this is almost never seen: HashRouter routes every navigation
 * through React.startTransition (react-router 7), so React keeps the previous
 * screen mounted until the new chunk resolves instead of falling back. It does
 * render on the *initial* mount of a deep-linked lazy route — the standalone
 * windows opened at `popup.html#/download-account-keys` and
 * `popup.html#/bring-web3-unlock` — which is why it keeps the popup's frame and
 * header rather than collapsing to null.
 */
export const LazyPageFallback = () => (
  <PopupLayout
    renderHeader={() => <HeaderPopup withConnectionStatus />}
    renderContent={() => (
      <Content>
        <Skeleton height={72} borderRadius={12} />
        <SpaceBetweenFlexRow>
          <Skeleton height={24} width={140} borderRadius={8} />
          <Skeleton height={24} width={64} borderRadius={8} />
        </SpaceBetweenFlexRow>
        <Skeleton height={24} borderRadius={8} />
        <Skeleton height={24} borderRadius={8} />
      </Content>
    )}
  />
);
